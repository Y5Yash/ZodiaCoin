// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


interface ReclaimContractInterface {
    struct CompleteClaimData {
		bytes32 identifier;
		address owner;
		uint32 timestampS;
		uint256 epoch;
	}
	struct ClaimInfo {
		string provider;
		string parameters;
		string context;
	}
    struct Witness {
		address addr;
		string host;
	}
    struct Epoch {
		uint32 id;
		uint32 timestampStart;
		uint32 timestampEnd;
		Witness[] witnesses;
		uint8 minimumWitnessesForClaimCreation;
	}
    function assertValidEpochAndSignedClaim(uint32 epochNum, ClaimInfo memory claimInfo, CompleteClaimData memory claimData, bytes[] memory signatures) external view;
}

contract FactoryZodiaCoin {
    address[] public deployedContracts;

    constructor(address reclaimContractAddress) {
        // Aries Coin
        ZodiaCoin AriesCoin = new ZodiaCoin("Aries", "ARCN", reclaimContractAddress, 321, 420);
        deployedContracts.push(address(AriesCoin));
        // Taurus
        ZodiaCoin TaurusCoin = new ZodiaCoin("Taurus", "TACN", reclaimContractAddress, 420, 521);
        deployedContracts.push(address(TaurusCoin));
        // Gemini
        ZodiaCoin GeminiCoin = new ZodiaCoin("Gemini", "GECN", reclaimContractAddress, 521, 622);
        deployedContracts.push(address(GeminiCoin));
        // Cancer
        ZodiaCoin CancerCoin = new ZodiaCoin("Cancer", "CNCN", reclaimContractAddress, 622, 723);
        deployedContracts.push(address(CancerCoin));
        // Leo
        ZodiaCoin LeoCoin = new ZodiaCoin("Leo", "LECN", reclaimContractAddress, 723, 823);
        deployedContracts.push(address(LeoCoin));
        // Virgo
        ZodiaCoin VirgoCoin = new ZodiaCoin("Virgo", "VICN", reclaimContractAddress, 823, 923);
        deployedContracts.push(address(VirgoCoin));
        // Libra
        ZodiaCoin LibraCoin = new ZodiaCoin("Libra", "LICN", reclaimContractAddress, 923, 1023);
        deployedContracts.push(address(LibraCoin));
        // Scorpio
        ZodiaCoin ScorpioCoin = new ZodiaCoin("Scorpio", "SCCN", reclaimContractAddress, 1023, 1122);
        deployedContracts.push(address(ScorpioCoin));
        // Sgittarius
        ZodiaCoin SagittariusCoin = new ZodiaCoin("Sagittarius", "SACN", reclaimContractAddress, 1122, 1222);
        deployedContracts.push(address(SagittariusCoin));
        // Capricon
        ZodiaCoin CapriconCoin = new ZodiaCoin("Capricon", "CPCN", reclaimContractAddress, 22, 120);
        deployedContracts.push(address(CapriconCoin));
        // Aquarius
        ZodiaCoin AquariusCoin = new ZodiaCoin("Aquarius", "AQCN", reclaimContractAddress, 120, 219);
        deployedContracts.push(address(AquariusCoin));
        // Pisces
        ZodiaCoin PiscesCoin = new ZodiaCoin("Pisces", "PICN", reclaimContractAddress, 219, 321);
        deployedContracts.push(address(PiscesCoin));
    }

    function getDeployedContracts() public view returns (address[] memory) {
        return deployedContracts;
    }
}

contract ZodiaCoin is ERC20 {
    uint256 startMMDD;
    uint256 endMMDD;
    address reclaimContractAddress;
    string provider;
    uint32 public coinsMinted;
    string public contextMessage;
    // string public contextSessionId;
    // address public contextAddress;
    // string public contextAddressString;
    // string public context;

    bytes _SYMBOLS = "0123456789abcdef";
    bytes _CAPITAL = "0123456789ABCDEF";
    
    constructor(string memory name, string memory symbol, address _reclaimContractAddress, uint256 _startMMDD, uint256 _endMMDD) ERC20(name, symbol) {
        // reclaimInterface = ReclaimContractInterface(reclaimContractAddress);
        reclaimContractAddress = _reclaimContractAddress;
        startMMDD = _startMMDD;
        endMMDD = _endMMDD;
        provider = "uidai-dob";
        contextMessage = "0x9efe9c1a82003dcca1be169c09f323fc5ee8d34f0e6d8b98c9f5bddbb97f7a22"; // can be set to name instead; Implications - possibly extra point of failure.
    }

    function isCorrectZodiac(uint256 _day, uint256 _month) internal view returns (bool){
        uint256 dayOfYearMMDD = _month*100 + _day;
        if (startMMDD <= dayOfYearMMDD && (dayOfYearMMDD % 1200) < endMMDD) {
            return true;
        }
        return false;
    }

    function getParams(uint256 _day, uint256 _month, uint256 _year) internal pure returns (string memory) {

        // add 0 to days and months less than 10. Convert them to string.
        string memory dayStr = Strings.toString(_day);
        if (_day<10) {
            dayStr = string(abi.encodePacked("0", dayStr));
        }
        string memory monthStr = Strings.toString(_month);
        if (_month<10) {
            monthStr = string(abi.encodePacked("0", monthStr));
        }
        string memory yearStr = Strings.toString(_year);

        string memory params = string(abi.encodePacked("{\"dob\":\"", yearStr, "-", monthStr, "-", dayStr, "\"}"));

        return params;
    }

    // Implement EIP-55 for context address string
    function addressToChecksumString(address tempaddr) public view returns (string memory) {
        bytes memory lowercase = addressToLowercaseBytes(tempaddr); // get address in lowercase hex without '0x'
        bytes32 hashed_addr = keccak256(abi.encodePacked(lowercase)); // get the hash of the lowercase address

        bytes memory result = new bytes(42); // store checksum address with '0x' prepended in this.
        result[0] = '0';
        result[1] = 'x';

        uint160 addrValue = uint160(tempaddr);
        uint160 hashValue = uint160(bytes20(hashed_addr));
        for (uint i = 41; i>1; --i) {
            uint addrIndex = addrValue & 0xf;
            uint hashIndex = hashValue & 0xf;
            if (hashIndex > 7) {
                result[i] = _CAPITAL[addrIndex];
            }
            else {
                result[i] = _SYMBOLS[addrIndex];
            }
            addrValue >>= 4;
            hashValue >>= 4;
        }
        return string(abi.encodePacked(result));
    }

    // get small case character corresponding to a byte.
    function getChar(bytes1 b) internal pure returns (bytes1 c) {
		if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
		else return bytes1(uint8(b) + 0x57);
	}

    // get convert address bytes to lowercase char hex bytes (without '0x').
    function addressToLowercaseBytes(address x) internal pure returns (bytes memory) {
		bytes memory s = new bytes(40);
		for (uint i = 0; i < 20; i++) {
			bytes1 b = bytes1(uint8(uint(uint160(x)) / (2 ** (8 * (19 - i)))));
			bytes1 hi = bytes1(uint8(b) / 16);
			bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
			s[2 * i] = getChar(hi);
			s[2 * i + 1] = getChar(lo);
		}
        return s;
	}

    function makeContext(address _contextAddress, string memory _contextSessionId) public view returns (string memory) {
        string memory contextAddressString = addressToChecksumString(_contextAddress);
        string memory contextString = string(abi.encodePacked("{\"contextAddress\":\"", contextAddressString, "\",\"contextMessage\":\"", contextMessage, "\",\"sessionId\":\"", _contextSessionId, "\"}"));
        return contextString;
    }

    function airDrop(uint32 _epoch, uint256 _day, uint256 _month, uint256 _year, string memory _provider, address _contextAddress, string memory _contextSessionId, ReclaimContractInterface.CompleteClaimData memory _claimData, bytes[] memory _signatures) public {
        
        // assert correct zodiac using day and month
        require(isCorrectZodiac(_day, _month), "Wrong Zodiac");

        // check if correct provider is used
        require( keccak256(abi.encodePacked(_provider)) == keccak256(abi.encodePacked(provider)), "Provider strings don't match." );

        // construct params string from the transaction inputs
        string memory params = getParams(_day, _month, _year);

        // generate context from contextMessage (constant), contextAddress (user-defined), and sessionId
        string memory context = makeContext(_contextAddress, _contextSessionId);

        // create a claiminfo struct object to send to reclaim for verification
        ReclaimContractInterface.ClaimInfo memory claimInfo = ReclaimContractInterface.ClaimInfo(_provider, params, context);

        // assertValidEpochAndSignedClaim will revert if either infoHash or Signatures don't match.
        ReclaimContractInterface(reclaimContractAddress).assertValidEpochAndSignedClaim(_epoch, claimInfo, _claimData, _signatures);

        // mint to _contextAddress
        coinsMinted+=1;
        _mint(_contextAddress, 1000 * (10 ** decimals()));
    }

}


// Semaphore Address: 0x3889927F0B5Eb1a02C6E2C20b39a1Bd4EAd76131
// Reclaim Address: 0xF93F605142Fb1Efad7Aa58253dDffF67775b4520
// Witness Address: 0x244897572368Eadf65bfBc5aec98D8e5443a9072
