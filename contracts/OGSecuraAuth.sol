// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title OGSecuraAuth (Clean Version)
 * @dev Smart contract for 0gSecura authentication on 0G Galileo Testnet
 * @notice No external dependencies - pure Solidity implementation
 */
contract OGSecuraAuth {
    
    // 0G Galileo Testnet Configuration
    uint256 public constant OG_GALILEO_CHAIN_ID = 16601;
    string public constant OG_NETWORK_NAME = "0G-Galileo-Testnet";
    string public constant OG_RPC_URL = "https://evmrpc-testnet.0g.ai";
    string public constant OG_BLOCK_EXPLORER = "https://chainscan-galileo.0g.ai";
    string public constant OG_FAUCET_URL = "https://faucet.0g.ai";
    
    // Contract version
    string public constant VERSION = "1.0.0";
    
    // Minimum OG token balance required for premium features (0.1 OG)
    uint256 public constant MINIMUM_OG_BALANCE = 0.1 ether;

    // Contract owner
    address public owner;

    struct UserProfile {
        bool isRegistered;
        uint256 registrationTimestamp;
        uint256 lastLoginTimestamp;
        uint256 totalScansPerformed;
        uint256 threatsReported;
        uint256 reputationScore;
        bool isPremiumUser;
        bytes32 profileHash;
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
    event UserRegistered(address indexed user, uint256 timestamp, bool isPremium);
    event UserAuthenticated(address indexed user, uint256 timestamp, bytes32 sessionHash);
    event SessionExpired(address indexed user, uint256 timestamp);
    event NetworkVerified(address indexed user, uint256 chainId, uint256 timestamp);
    event ScanPerformed(address indexed user, string scanType, uint256 timestamp);
    event ThreatReported(address indexed reporter, bytes32 indexed threatHash, uint256 timestamp);
    event ReputationUpdated(address indexed user, uint256 oldScore, uint256 newScore);
    event NetworkConfigurationRequested(address indexed user, uint256 correctChainId, string rpcUrl);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
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

    // Simple reentrancy guard
    bool private locked;
    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    constructor() {
        require(block.chainid == OG_GALILEO_CHAIN_ID, "Deploy only on 0G Galileo Testnet");
        owner = msg.sender;
    }

    function registerUser(bytes32 profileHash) external onlyCorrectNetwork nonReentrant {
        require(!userProfiles[msg.sender].isRegistered, "User already registered");
        
        bool isPremium = msg.sender.balance >= MINIMUM_OG_BALANCE;
        
        userProfiles[msg.sender] = UserProfile({
            isRegistered: true,
            registrationTimestamp: block.timestamp,
            lastLoginTimestamp: block.timestamp,
            totalScansPerformed: 0,
            threatsReported: 0,
            reputationScore: 100,
            isPremiumUser: isPremium,
            profileHash: profileHash
        });
        
        registeredUsers.push(msg.sender);
        
        emit UserRegistered(msg.sender, block.timestamp, isPremium);
        emit NetworkVerified(msg.sender, block.chainid, block.timestamp);
    }

    function authenticateUser(string calldata message, bytes memory signature, bytes32 nonce) 
        external onlyRegisteredUser onlyCorrectNetwork nonReentrant {
        require(!usedNonces[nonce], "Nonce already used");
        require(signature.length == 65, "Invalid signature length");
        
        // Extract v, r, s from signature
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n", bytes(message).length, message));
        address recoveredSigner = ecrecover(messageHash, v, r, s);
        require(recoveredSigner == msg.sender, "Invalid signature");
        
        usedNonces[nonce] = true;
        
        bytes32 sessionHash = keccak256(abi.encodePacked(msg.sender, block.timestamp, nonce));
        
        authSessions[msg.sender] = AuthSession({
            isActive: true,
            expirationTimestamp: block.timestamp + 24 hours,
            sessionHash: sessionHash
        });
        
        userProfiles[msg.sender].lastLoginTimestamp = block.timestamp;
        
        emit UserAuthenticated(msg.sender, block.timestamp, sessionHash);
    }

    function recordScan(string calldata scanType) external onlyValidSession onlyCorrectNetwork {
        userProfiles[msg.sender].totalScansPerformed++;
        
        if (userProfiles[msg.sender].reputationScore < 500) {
            userProfiles[msg.sender].reputationScore += 1;
        }
        
        emit ScanPerformed(msg.sender, scanType, block.timestamp);
    }

    function reportThreat(bytes32 threatHash) external onlyValidSession onlyCorrectNetwork {
        userProfiles[msg.sender].threatsReported++;
        
        uint256 oldScore = userProfiles[msg.sender].reputationScore;
        userProfiles[msg.sender].reputationScore += 10;
        
        if (userProfiles[msg.sender].reputationScore > 1000) {
            userProfiles[msg.sender].reputationScore = 1000;
        }
        
        emit ThreatReported(msg.sender, threatHash, block.timestamp);
        emit ReputationUpdated(msg.sender, oldScore, userProfiles[msg.sender].reputationScore);
    }

    function logout() external onlyRegisteredUser {
        authSessions[msg.sender].isActive = false;
        emit SessionExpired(msg.sender, block.timestamp);
    }

    function isValidSession(address user) external view returns (bool) {
        AuthSession memory session = authSessions[user];
        return session.isActive && session.expirationTimestamp > block.timestamp;
    }

    function getUserProfile(address user) external view returns (UserProfile memory) {
        return userProfiles[user];
    }

    function getContractStats() external view returns (uint256 totalUsers, uint256 totalScans, uint256 totalThreats) {
        totalUsers = registeredUsers.length;
        
        for (uint256 i = 0; i < registeredUsers.length; i++) {
            address user = registeredUsers[i];
            totalScans += userProfiles[user].totalScansPerformed;
            totalThreats += userProfiles[user].threatsReported;
        }
    }

    function getNetworkInfo() external view returns (uint256 chainId, bool isOGNetwork) {
        chainId = block.chainid;
        isOGNetwork = (chainId == OG_GALILEO_CHAIN_ID);
    }

    /**
     * @dev Get complete network configuration for wallet setup
     * @return chainId The required chain ID (16601)
     * @return networkName The network name for wallet
     * @return rpcUrl The RPC URL for wallet configuration
     * @return blockExplorer The block explorer URL
     * @return faucetUrl The faucet URL for getting test tokens
     */
    function getNetworkConfiguration() external view returns (
        uint256 chainId,
        string memory networkName,
        string memory rpcUrl,
        string memory blockExplorer,
        string memory faucetUrl
    ) {
        chainId = OG_GALILEO_CHAIN_ID;
        networkName = OG_NETWORK_NAME;
        rpcUrl = OG_RPC_URL;
        blockExplorer = OG_BLOCK_EXPLORER;
        faucetUrl = OG_FAUCET_URL;
    }

    /**
     * @dev Check if user is on correct network and emit configuration if not
     * @dev This function can be called by frontend to get network config via events
     */
    function validateAndEmitNetworkConfig() external {
        if (block.chainid != OG_GALILEO_CHAIN_ID) {
            emit NetworkConfigurationRequested(msg.sender, OG_GALILEO_CHAIN_ID, OG_RPC_URL);
        } else {
            emit NetworkVerified(msg.sender, block.chainid, block.timestamp);
        }
    }

    /**
     * @dev Get network configuration for wallet as a structured object
     * @return A JSON-like string with wallet configuration (for easy frontend parsing)
     */
    function getWalletNetworkConfig() external pure returns (string memory) {
        return string(abi.encodePacked(
            '{"chainId":"0x40E9","chainName":"', OG_NETWORK_NAME, 
            '","rpcUrls":["', OG_RPC_URL, 
            '"],"blockExplorerUrls":["', OG_BLOCK_EXPLORER, 
            '"],"nativeCurrency":{"name":"OG","symbol":"OG","decimals":18}}'
        ));
    }

    function verifyNetworkAndUpdateStatus() external onlyRegisteredUser onlyCorrectNetwork nonReentrant {
        bool isPremium = msg.sender.balance >= MINIMUM_OG_BALANCE;
        userProfiles[msg.sender].isPremiumUser = isPremium;
        
        emit NetworkVerified(msg.sender, block.chainid, block.timestamp);
    }

    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}
