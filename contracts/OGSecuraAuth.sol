// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OGSecuraAuth
 * @dev Wallet authentication and user management for 0gSecura platform
 * @notice This contract manages user authentication, profiles, and activity tracking
 * @custom:security-contact security@0gsecura.io
 */
contract OGSecuraAuth {
    
    // ============================================================
    // STATE VARIABLES
    // ============================================================
    
    /// @notice Contract owner address
    address public owner;
    
    /// @notice Total registered users
    uint256 public totalUsers;
    
    /// @notice Total scans performed across all users
    uint256 public totalScans;
    
    /// @notice Total threats reported
    uint256 public totalThreats;
    
    /// @notice Session timeout duration (24 hours)
    uint256 public constant SESSION_TIMEOUT = 24 hours;
    
    /// @notice Minimum reputation score for premium status
    uint256 public constant PREMIUM_THRESHOLD = 100;
    
    /// @notice Expected chain ID (16600 for 0G Mainnet, 16601 for Testnet)
    uint256 public immutable CHAIN_ID;
    
    // ============================================================
    // DATA STRUCTURES
    // ============================================================
    
    /// @notice User profile structure
    struct UserProfile {
        bool isRegistered;              // Whether user has registered
        uint256 registrationTimestamp;  // When user registered
        uint256 lastLoginTimestamp;     // Last authentication time
        uint256 totalScansPerformed;    // Total number of scans
        uint256 threatsReported;        // Total threats reported
        uint256 reputationScore;        // User reputation score
        bool isPremiumUser;             // Premium status
        bytes32 profileHash;            // IPFS hash of user profile data
    }
    
    /// @notice Session information
    struct Session {
        bytes32 sessionHash;        // Hash of the session
        uint256 expiryTimestamp;    // When session expires
        bool isActive;              // Whether session is active
    }
    
    // ============================================================
    // MAPPINGS
    // ============================================================
    
    /// @notice User address to profile mapping
    mapping(address => UserProfile) public userProfiles;
    
    /// @notice User address to current session mapping
    mapping(address => Session) public sessions;
    
    /// @notice Mapping to track used nonces (prevents replay attacks)
    mapping(bytes32 => bool) public usedNonces;
    
    /// @notice Track reported threat hashes
    mapping(bytes32 => bool) public reportedThreats;
    
    // ============================================================
    // EVENTS
    // ============================================================
    
    event UserRegistered(address indexed user, uint256 timestamp, bool isPremium);
    event UserAuthenticated(address indexed user, uint256 timestamp, bytes32 sessionHash);
    event NetworkVerified(address indexed user, uint256 chainId, uint256 timestamp);
    event ScanPerformed(address indexed user, string scanType, uint256 timestamp);
    event ThreatReported(address indexed reporter, bytes32 indexed threatHash, uint256 timestamp);
    event SessionExpired(address indexed user, uint256 timestamp);
    event PremiumStatusGranted(address indexed user, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // ============================================================
    // MODIFIERS
    // ============================================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyRegistered() {
        require(userProfiles[msg.sender].isRegistered, "User not registered");
        _;
    }
    
    modifier validSession() {
        Session storage session = sessions[msg.sender];
        require(session.isActive, "No active session");
        require(block.timestamp < session.expiryTimestamp, "Session expired");
        _;
    }
    
    // ============================================================
    // CONSTRUCTOR
    // ============================================================
    
    constructor() {
        owner = msg.sender;
        CHAIN_ID = block.chainid;
        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    // ============================================================
    // CORE FUNCTIONS
    // ============================================================
    
    /**
     * @notice Register a new user
     * @param profileHash IPFS hash of user profile data
     */
    function registerUser(bytes32 profileHash) external {
        require(!userProfiles[msg.sender].isRegistered, "User already registered");
        require(profileHash != bytes32(0), "Invalid profile hash");
        
        UserProfile storage profile = userProfiles[msg.sender];
        profile.isRegistered = true;
        profile.registrationTimestamp = block.timestamp;
        profile.lastLoginTimestamp = block.timestamp;
        profile.profileHash = profileHash;
        profile.reputationScore = 10; // Starting reputation
        
        totalUsers++;
        
        emit UserRegistered(msg.sender, block.timestamp, false);
    }
    
    /**
     * @notice Authenticate user with signed message
     * @param message The message that was signed
     * @param signature The signature from the user's wallet
     * @param nonce Unique nonce to prevent replay attacks
     */
    function authenticateUser(
        string calldata message,
        bytes calldata signature,
        bytes32 nonce
    ) external onlyRegistered {
        require(!usedNonces[nonce], "Nonce already used");
        require(signature.length == 65, "Invalid signature length");
        
        // Verify the signature
        bytes32 messageHash = keccak256(abi.encodePacked(message));
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        
        address recoveredSigner = recoverSigner(ethSignedMessageHash, signature);
        require(recoveredSigner == msg.sender, "Invalid signature");
        
        // Mark nonce as used
        usedNonces[nonce] = true;
        
        // Create new session
        bytes32 sessionHash = keccak256(abi.encodePacked(msg.sender, block.timestamp, nonce));
        sessions[msg.sender] = Session({
            sessionHash: sessionHash,
            expiryTimestamp: block.timestamp + SESSION_TIMEOUT,
            isActive: true
        });
        
        // Update last login
        userProfiles[msg.sender].lastLoginTimestamp = block.timestamp;
        
        emit UserAuthenticated(msg.sender, block.timestamp, sessionHash);
    }
    
    /**
     * @notice Verify network and update premium status based on reputation
     */
    function verifyNetworkAndUpdateStatus() external onlyRegistered validSession {
        UserProfile storage profile = userProfiles[msg.sender];
        
        // Check if user qualifies for premium
        if (profile.reputationScore >= PREMIUM_THRESHOLD && !profile.isPremiumUser) {
            profile.isPremiumUser = true;
            emit PremiumStatusGranted(msg.sender, block.timestamp);
        }
        
        emit NetworkVerified(msg.sender, block.chainid, block.timestamp);
    }
    
    /**
     * @notice Record a security scan
     * @param scanType Type of scan performed (e.g., "token", "website", "transaction")
     */
    function recordScan(string calldata scanType) external onlyRegistered validSession {
        require(bytes(scanType).length > 0, "Invalid scan type");
        
        UserProfile storage profile = userProfiles[msg.sender];
        profile.totalScansPerformed++;
        profile.reputationScore += 1; // Increase reputation for activity
        
        totalScans++;
        
        // Auto-upgrade to premium if threshold reached
        if (profile.reputationScore >= PREMIUM_THRESHOLD && !profile.isPremiumUser) {
            profile.isPremiumUser = true;
            emit PremiumStatusGranted(msg.sender, block.timestamp);
        }
        
        emit ScanPerformed(msg.sender, scanType, block.timestamp);
    }
    
    /**
     * @notice Report a security threat
     * @param threatHash Hash of the threat data (stored on 0G Storage)
     */
    function reportThreat(bytes32 threatHash) external onlyRegistered validSession {
        require(threatHash != bytes32(0), "Invalid threat hash");
        require(!reportedThreats[threatHash], "Threat already reported");
        
        reportedThreats[threatHash] = true;
        
        UserProfile storage profile = userProfiles[msg.sender];
        profile.threatsReported++;
        profile.reputationScore += 5; // Higher reward for threat reporting
        
        totalThreats++;
        
        // Auto-upgrade to premium if threshold reached
        if (profile.reputationScore >= PREMIUM_THRESHOLD && !profile.isPremiumUser) {
            profile.isPremiumUser = true;
            emit PremiumStatusGranted(msg.sender, block.timestamp);
        }
        
        emit ThreatReported(msg.sender, threatHash, block.timestamp);
    }
    
    /**
     * @notice Logout and invalidate current session
     */
    function logout() external onlyRegistered {
        Session storage session = sessions[msg.sender];
        require(session.isActive, "No active session");
        
        session.isActive = false;
        session.expiryTimestamp = block.timestamp;
        
        emit SessionExpired(msg.sender, block.timestamp);
    }
    
    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================
    
    /**
     * @notice Check if user has a valid active session
     * @param user Address to check
     * @return bool Whether session is valid
     */
    function isValidSession(address user) external view returns (bool) {
        Session storage session = sessions[user];
        return session.isActive && block.timestamp < session.expiryTimestamp;
    }
    
    /**
     * @notice Get user profile information
     * @param user Address to query
     * @return profile User's complete profile
     */
    function getUserProfile(address user) 
        external 
        view 
        returns (UserProfile memory profile) 
    {
        return userProfiles[user];
    }
    
    /**
     * @notice Get contract-wide statistics
     * @return _totalUsers Total registered users
     * @return _totalScans Total scans performed
     * @return _totalThreats Total threats reported
     */
    function getContractStats() 
        external 
        view 
        returns (
            uint256 _totalUsers,
            uint256 _totalScans,
            uint256 _totalThreats
        ) 
    {
        return (totalUsers, totalScans, totalThreats);
    }
    
    /**
     * @notice Get network information
     * @return chainId Current chain ID
     * @return isOGNetwork Whether on 0G network (mainnet or testnet)
     */
    function getNetworkInfo() 
        external 
        view 
        returns (uint256 chainId, bool isOGNetwork) 
    {
        chainId = block.chainid;
        // 16600 = 0G Mainnet, 16601 = 0G Galileo Testnet
        isOGNetwork = (chainId == 16600 || chainId == 16601);
    }
    
    /**
     * @notice Get session information for a user
     * @param user Address to query
     * @return session Session details
     */
    function getSession(address user) 
        external 
        view 
        returns (Session memory session) 
    {
        return sessions[user];
    }
    
    /**
     * @notice Check if a threat has been reported
     * @param threatHash Hash to check
     * @return bool Whether threat was reported
     */
    function isThreatReported(bytes32 threatHash) external view returns (bool) {
        return reportedThreats[threatHash];
    }
    
    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================
    
    /**
     * @notice Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
    
    /**
     * @notice Manually grant premium status (owner only)
     * @param user User address
     */
    function grantPremiumStatus(address user) external onlyOwner {
        require(userProfiles[user].isRegistered, "User not registered");
        require(!userProfiles[user].isPremiumUser, "Already premium");
        
        userProfiles[user].isPremiumUser = true;
        emit PremiumStatusGranted(user, block.timestamp);
    }
    
    /**
     * @notice Update user reputation (owner only, for moderation)
     * @param user User address
     * @param newReputation New reputation score
     */
    function updateReputation(address user, uint256 newReputation) external onlyOwner {
        require(userProfiles[user].isRegistered, "User not registered");
        userProfiles[user].reputationScore = newReputation;
    }
    
    // ============================================================
    // INTERNAL HELPER FUNCTIONS
    // ============================================================
    
    /**
     * @notice Recover signer address from signature
     * @param ethSignedMessageHash Hash of the signed message
     * @param signature The signature bytes
     * @return signer The address that created the signature
     */
    function recoverSigner(
        bytes32 ethSignedMessageHash,
        bytes memory signature
    ) internal pure returns (address signer) {
        require(signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        // Adjust v if needed (some wallets return v as 0 or 1)
        if (v < 27) {
            v += 27;
        }
        
        require(v == 27 || v == 28, "Invalid signature v value");
        
        return ecrecover(ethSignedMessageHash, v, r, s);
    }
    
    /**
     * @notice Get contract version
     * @return version Version string
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}
