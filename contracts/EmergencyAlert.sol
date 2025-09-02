// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EmergencyAlert
 * @dev Smart contract for managing tourist emergency alerts with real-time event emission
 */
contract EmergencyAlert is Ownable {
    
    // Alert types enum
    enum AlertType {
        PANIC,      // Manual panic button
        GEOFENCE,   // Geo-fence breach
        ANOMALY     // Anomaly detection
    }
    
    // Alert structure
    struct Alert {
        address tourist;        // Tourist wallet address
        AlertType alertType;    // Type of alert
        string location;        // Location string (lat,lng or address)
        uint256 timestamp;      // Block timestamp
        bool isActive;          // Whether alert is still active
        string description;     // Additional description
    }
    
    // State variables
    mapping(uint256 => Alert) public alerts;
    mapping(address => uint256[]) public touristAlerts;
    uint256 public alertCounter;
    
    // Emergency contacts
    mapping(string => address) public emergencyContacts;
    string[] public contactTypes;
    
    // Events
    event AlertTriggered(
        uint256 indexed alertId,
        address indexed tourist,
        AlertType alertType,
        string location,
        uint256 timestamp,
        string description
    );
    
    event AlertResolved(
        uint256 indexed alertId,
        address indexed tourist,
        uint256 resolvedAt
    );
    
    event EmergencyContactAdded(
        string contactType,
        address contactAddress
    );
    
    event EmergencyContactRemoved(
        string contactType
    );
    
    // Modifiers
    modifier validAlertType(AlertType _alertType) {
        require(
            _alertType == AlertType.PANIC || 
            _alertType == AlertType.GEOFENCE || 
            _alertType == AlertType.ANOMALY,
            "Invalid alert type"
        );
        _;
    }
    
    modifier alertExists(uint256 _alertId) {
        require(_alertId < alertCounter, "Alert does not exist");
        _;
    }
    
    constructor() {
        // Initialize with default emergency contact types
        contactTypes.push("POLICE");
        contactTypes.push("AMBULANCE");
        contactTypes.push("TOURISM_AUTHORITY");
    }
    
    /**
     * @dev Trigger an emergency alert
     * @param _alertType Type of alert (PANIC, GEOFENCE, ANOMALY)
     * @param _location Location string
     * @param _description Additional description
     */
    function triggerAlert(
        AlertType _alertType,
        string memory _location,
        string memory _description
    ) 
        external 
        validAlertType(_alertType)
    {
        require(bytes(_location).length > 0, "Location cannot be empty");
        
        uint256 alertId = alertCounter;
        
        alerts[alertId] = Alert({
            tourist: msg.sender,
            alertType: _alertType,
            location: _location,
            timestamp: block.timestamp,
            isActive: true,
            description: _description
        });
        
        touristAlerts[msg.sender].push(alertId);
        alertCounter++;
        
        emit AlertTriggered(
            alertId,
            msg.sender,
            _alertType,
            _location,
            block.timestamp,
            _description
        );
    }
    
    /**
     * @dev Resolve an active alert
     * @param _alertId Alert ID to resolve
     */
    function resolveAlert(uint256 _alertId) 
        external 
        alertExists(_alertId)
    {
        Alert storage alert = alerts[_alertId];
        require(alert.isActive, "Alert is already resolved");
        require(
            msg.sender == alert.tourist || msg.sender == owner(),
            "Only tourist or owner can resolve alert"
        );
        
        alert.isActive = false;
        
        emit AlertResolved(_alertId, alert.tourist, block.timestamp);
    }
    
    /**
     * @dev Get alert details
     * @param _alertId Alert ID
     * @return Alert struct
     */
    function getAlert(uint256 _alertId) 
        external 
        view 
        alertExists(_alertId)
        returns (Alert memory)
    {
        return alerts[_alertId];
    }
    
    /**
     * @dev Get all alerts for a tourist
     * @param _tourist Tourist wallet address
     * @return Array of alert IDs
     */
    function getTouristAlerts(address _tourist) 
        external 
        view 
        returns (uint256[] memory)
    {
        return touristAlerts[_tourist];
    }
    
    /**
     * @dev Get recent alerts (last N alerts)
     * @param _count Number of recent alerts to return
     * @return Array of alert IDs
     */
    function getRecentAlerts(uint256 _count) 
        external 
        view 
        returns (uint256[] memory)
    {
        require(_count > 0, "Count must be greater than 0");
        
        uint256 totalAlerts = alertCounter;
        uint256 returnCount = _count > totalAlerts ? totalAlerts : _count;
        
        uint256[] memory recentAlerts = new uint256[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            recentAlerts[i] = totalAlerts - 1 - i;
        }
        
        return recentAlerts;
    }
    
    /**
     * @dev Get active alerts count
     * @return Number of active alerts
     */
    function getActiveAlertsCount() external view returns (uint256) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < alertCounter; i++) {
            if (alerts[i].isActive) {
                activeCount++;
            }
        }
        return activeCount;
    }
    
    /**
     * @dev Get alerts by type
     * @param _alertType Alert type to filter by
     * @return Array of alert IDs
     */
    function getAlertsByType(AlertType _alertType) 
        external 
        view 
        returns (uint256[] memory)
    {
        uint256[] memory tempAlerts = new uint256[](alertCounter);
        uint256 count = 0;
        
        for (uint256 i = 0; i < alertCounter; i++) {
            if (alerts[i].alertType == _alertType) {
                tempAlerts[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tempAlerts[i];
        }
        
        return result;
    }
    
    /**
     * @dev Add emergency contact
     * @param _contactType Type of contact (POLICE, AMBULANCE, etc.)
     * @param _contactAddress Contact wallet address
     */
    function addEmergencyContact(
        string memory _contactType,
        address _contactAddress
    ) external onlyOwner {
        require(_contactAddress != address(0), "Invalid contact address");
        require(bytes(_contactType).length > 0, "Contact type cannot be empty");
        
        emergencyContacts[_contactType] = _contactAddress;
        
        // Add to contact types if not already present
        bool exists = false;
        for (uint256 i = 0; i < contactTypes.length; i++) {
            if (keccak256(bytes(contactTypes[i])) == keccak256(bytes(_contactType))) {
                exists = true;
                break;
            }
        }
        
        if (!exists) {
            contactTypes.push(_contactType);
        }
        
        emit EmergencyContactAdded(_contactType, _contactAddress);
    }
    
    /**
     * @dev Remove emergency contact
     * @param _contactType Type of contact to remove
     */
    function removeEmergencyContact(string memory _contactType) external onlyOwner {
        require(emergencyContacts[_contactType] != address(0), "Contact does not exist");
        
        delete emergencyContacts[_contactType];
        
        // Remove from contact types array
        for (uint256 i = 0; i < contactTypes.length; i++) {
            if (keccak256(bytes(contactTypes[i])) == keccak256(bytes(_contactType))) {
                contactTypes[i] = contactTypes[contactTypes.length - 1];
                contactTypes.pop();
                break;
            }
        }
        
        emit EmergencyContactRemoved(_contactType);
    }
    
    /**
     * @dev Get all contact types
     * @return Array of contact type strings
     */
    function getContactTypes() external view returns (string[] memory) {
        return contactTypes;
    }
    
    /**
     * @dev Get emergency contact address
     * @param _contactType Type of contact
     * @return Contact wallet address
     */
    function getEmergencyContact(string memory _contactType) 
        external 
        view 
        returns (address)
    {
        return emergencyContacts[_contactType];
    }
    
    /**
     * @dev Get alert type as string
     * @param _alertType Alert type enum
     * @return String representation of alert type
     */
    function getAlertTypeString(AlertType _alertType) 
        external 
        pure 
        returns (string memory)
    {
        if (_alertType == AlertType.PANIC) {
            return "PANIC";
        } else if (_alertType == AlertType.GEOFENCE) {
            return "GEOFENCE";
        } else if (_alertType == AlertType.ANOMALY) {
            return "ANOMALY";
        } else {
            return "UNKNOWN";
        }
    }
    
    /**
     * @dev Get contract statistics
     * @return totalAlerts Total number of alerts
     * @return activeAlerts Number of active alerts
     * @return totalTourists Number of unique tourists who triggered alerts
     */
    function getContractStats() 
        external 
        view 
        returns (
            uint256 totalAlerts,
            uint256 activeAlerts,
            uint256 totalTourists
        )
    {
        totalAlerts = alertCounter;
        activeAlerts = 0;
        
        // Count active alerts and unique tourists
        address[] memory uniqueTourists = new address[](alertCounter);
        uint256 touristCount = 0;
        
        for (uint256 i = 0; i < alertCounter; i++) {
            if (alerts[i].isActive) {
                activeAlerts++;
            }
            
            // Check if tourist is already counted
            bool touristExists = false;
            for (uint256 j = 0; j < touristCount; j++) {
                if (uniqueTourists[j] == alerts[i].tourist) {
                    touristExists = true;
                    break;
                }
            }
            
            if (!touristExists) {
                uniqueTourists[touristCount] = alerts[i].tourist;
                touristCount++;
            }
        }
        
        totalTourists = touristCount;
    }
}
