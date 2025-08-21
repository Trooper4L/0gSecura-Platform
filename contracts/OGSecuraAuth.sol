// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title OGSecuraAuth
 * @dev Smart contract for 0gSecura authentication and user management on 0G Galileo Testnet
 * @notice This contract handles user registration, authentication, and network verification
 */
contract OGSecuraAuth is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // 0G Galileo Testnet Chain ID
    uint256 public constant OG_GALILEO_CHAIN_ID = 16601;
    
    // Contract version
    string public constant VERSION = "1.0.0";
    
    // Minimum OG token balance required for premium features (0.1 OG)
    uint256 public constant MINIMUM_OG_BALANCE = 0.1 ether;

    struct UserProfile {
        bool isRegistered;
        uint256 registrationTimestamp;
        uint256 lastLoginTimestamp;
        uint256 totalScansPerformed;
        uint256 threatsReported;
        uint256 reputationScore;
        bool isPremiumUser;
        bytes32 profileHash; // IPFS hash for extended profile data
    }

    struct AuthSession {
        bool isActive;
        uint256 expirationTimestamp;
        bytes32 sessionHash;
    }

    // Mappings
    mapping(address => UserProfile) public userProfiles;
    mapping(address => AuthSession) public authSessions;
    mapping(bytes32 => bool) public usedNonces;
    
    // Arrays for analytics
    address[] public registeredUsers;
    
    // Events
    event UserRegistered(
        address indexed user,
        uint256 timestamp,
        bool isPremium
    );
    
    event UserAuthenticated(
        address indexed user,
        uint256 timestamp,
        bytes32 sessionHash
    );
    
    event SessionExpired(
        address indexed user,
        uint256 timestamp
    );
    
    event NetworkVerified(
        address indexed user,
        uint256 chainId,
        uint256 timestamp
    );
    
    event ScanPerformed(
        address indexed user,
        string scanType,
        uint256 timestamp
    );
    
    event ThreatReported(
        address indexed reporter,
        bytes32 indexed threatHash,
        uint256 timestamp
    );
    
    event ReputationUpdated(
        address indexed user,
        uint256 oldScore,
        uint256 newScore
    );

    // Modifiers
    modifier onlyRegisteredUser() {
        require(userProfiles[msg.sender].isRegistered, "User not registered");
        _;
    }
    
    modifier onlyValidSession() {
        require(
            authSessions[msg.sender].isActive &&
            authSessions[msg.sender].expirationTimestamp > block.timestamp,
            "Invalid or expired session"
        );
        _;
    }
    
    modifier onlyCorrectNetwork() {
        require(block.chainid == OG_GALILEO_CHAIN_ID, "Must be on 0G Galileo Testnet");
        _;
    }

    constructor() Ownable(msg.sender) {
        // Contract deployment on 0G Galileo Testnet only
        require(block.chainid == OG_GALILEO_CHAIN_ID, "Deploy only on 0G Galileo Testnet");
    }

    /**
     * @dev Register a new user profile
     * @param profileHash IPFS hash containing extended profile information
     */
    function registerUser(bytes32 profileHash) 
        external 
        onlyCorrectNetwork 
        nonReentrant 
    {
        require(!userProfiles[msg.sender].isRegistered, "User already registered");
        
        bool isPremium = msg.sender.balance >= MINIMUM_OG_BALANCE;
        
        userProfiles[msg.sender] = UserProfile({
            isRegistered: true,
            registrationTimestamp: block.timestamp,
            lastLoginTimestamp: block.timestamp,
            totalScansPerformed: 0,
            threatsReported: 0,
            reputationScore: 100, // Starting reputation score
            isPremiumUser: isPremium,
            profileHash: profileHash
        });
        
        registeredUsers.push(msg.sender);
        
        emit UserRegistered(msg.sender, block.timestamp, isPremium);
        emit NetworkVerified(msg.sender, block.chainid, block.timestamp);
    }

    /**
     * @dev Authenticate user and create session
     * @param message The message that was signed
     * @param signature The signature from the user's wallet
     * @param nonce Unique nonce to prevent replay attacks
     */
    function authenticateUser(
        string calldata message,
        bytes calldata signature,
        bytes32 nonce
    ) 
        external 
        onlyRegisteredUser 
        onlyCorrectNetwork 
        nonReentrant 
    {
        require(!usedNonces[nonce], "Nonce already used");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n",
            bytes(message).length,
            message,
            nonce,
            block.chainid
        ));
        
        address recoveredSigner = messageHash.recover(signature);
        require(recoveredSigner == msg.sender, "Invalid signature");
        
        // Mark nonce as used
        usedNonces[nonce] = true;
        
        // Create session (24 hours)
        bytes32 sessionHash = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            nonce
        ));
        
        authSessions[msg.sender] = AuthSession({
            isActive: true,
            expirationTimestamp: block.timestamp + 24 hours,
            sessionHash: sessionHash
        });
        
        // Update last login
        userProfiles[msg.sender].lastLoginTimestamp = block.timestamp;
        
        emit UserAuthenticated(msg.sender, block.timestamp, sessionHash);
    }

    /**
     * @dev Verify user is on correct network and update premium status
     */
    function verifyNetworkAndUpdateStatus() 
        external 
        onlyRegisteredUser 
        onlyCorrectNetwork 
        nonReentrant 
    {
        // Update premium status based on current balance
        bool isPremium = msg.sender.balance >= MINIMUM_OG_BALANCE;
        userProfiles[msg.sender].isPremiumUser = isPremium;
        
        emit NetworkVerified(msg.sender, block.chainid, block.timestamp);
    }

    /**
     * @dev Record a security scan performed by user
     * @param scanType Type of scan performed (token, website, etc.)
     */
    function recordScan(string calldata scanType) 
        external 
        onlyValidSession 
        onlyCorrectNetwork 
    {
        userProfiles[msg.sender].totalScansPerformed++;
        
        // Increase reputation for active scanning (max 500 points from scans)
        if (userProfiles[msg.sender].reputationScore < 500) {
            userProfiles[msg.sender].reputationScore += 1;
        }
        
        emit ScanPerformed(msg.sender, scanType, block.timestamp);
    }

    /**
     * @dev Record a threat report from user
     * @param threatHash Hash of the threat report data stored in 0G Storage
     */
    function reportThreat(bytes32 threatHash) 
        external 
        onlyValidSession 
        onlyCorrectNetwork 
    {
        userProfiles[msg.sender].threatsReported++;
        
        // Increase reputation for threat reporting (significant boost)
        uint256 oldScore = userProfiles[msg.sender].reputationScore;
        userProfiles[msg.sender].reputationScore += 10;
        
        // Cap reputation at 1000
        if (userProfiles[msg.sender].reputationScore > 1000) {
            userProfiles[msg.sender].reputationScore = 1000;
        }
        
        emit ThreatReported(msg.sender, threatHash, block.timestamp);
        emit ReputationUpdated(msg.sender, oldScore, userProfiles[msg.sender].reputationScore);
    }

    /**
     * @dev End user session
     */
    function logout() external onlyRegisteredUser {
        authSessions[msg.sender].isActive = false;
        emit SessionExpired(msg.sender, block.timestamp);
    }

    /**
     * @dev Check if user session is valid
     * @param user Address to check
     * @return bool Session validity
     */
    function isValidSession(address user) external view returns (bool) {
        AuthSession memory session = authSessions[user];
        return session.isActive && session.expirationTimestamp > block.timestamp;
    }

    /**
     * @dev Get user profile information
     * @param user Address to query
     * @return UserProfile struct
     */
    function getUserProfile(address user) external view returns (UserProfile memory) {
        return userProfiles[user];
    }

    /**
     * @dev Get contract statistics
     * @return totalUsers Total registered users
     * @return totalScans Total scans performed across all users
     * @return totalThreats Total threats reported
     */
    function getContractStats() external view returns (
        uint256 totalUsers,
        uint256 totalScans,
        uint256 totalThreats
    ) {
        totalUsers = registeredUsers.length;
        
        for (uint256 i = 0; i < registeredUsers.length; i++) {
            address user = registeredUsers[i];
            totalScans += userProfiles[user].totalScansPerformed;
            totalThreats += userProfiles[user].threatsReported;
        }
    }

    /**
     * @dev Emergency function to pause contract (owner only)
     */
    bool public contractPaused = false;
    
    function toggleContractPause() external onlyOwner {
        contractPaused = !contractPaused;
    }
    
    modifier whenNotPaused() {
        require(!contractPaused, "Contract is paused");
        _;
    }

    /**
     * @dev Get network information to verify deployment
     * @return chainId Current chain ID
     * @return isOGNetwork Whether this is 0G Galileo Testnet
     */
    function getNetworkInfo() external view returns (uint256 chainId, bool isOGNetwork) {
        chainId = block.chainid;
        isOGNetwork = (chainId == OG_GALILEO_CHAIN_ID);
    }

    /**
     * @dev Withdraw contract balance (owner only, emergency use)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Receive function to accept OG tokens
     */
    receive() external payable {
        // Contract can receive OG tokens for premium user verification
    }
}
