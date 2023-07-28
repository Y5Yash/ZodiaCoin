// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./lib/Claims.sol";

interface ReclaimContractInterface {
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
    function assertValidSignedClaimAndInfoHash(uint256 claimId, Claims.ClaimInfo memory claimInfo, bytes[] memory signatures) external view;
    function fetchEpoch(uint32 epoch) external view returns (Epoch memory);
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
    uint32 coinsMinted;
    bytes32 contextMessage;

    constructor(string memory name, string memory symbol, address _reclaimContractAddress, uint256 _startMMDD, uint256 _endMMDD) ERC20(name, symbol) {
        // reclaimInterface = ReclaimContractInterface(reclaimContractAddress);
        reclaimContractAddress = _reclaimContractAddress;
        startMMDD = _startMMDD;
        endMMDD = _endMMDD;
        contextMessage = keccak256(abi.encode("ZodiaCoin")); // can be set to name instead; Implications - possibly extra point of failure.
    }

    function isCorrectZodiac(uint256 _day, uint256 _month) internal view returns (bool){
        uint256 dayOfYearMMDD = _month*100 + _day;
        if (startMMDD <= dayOfYearMMDD && dayOfYearMMDD < endMMDD) {
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

    function mint(uint32 _epoch, uint256 _day, uint256 _month, uint256 _year, string memory _provider, address _contextAddress, Claims.CompleteClaimData memory _claimData, bytes[] memory _signatures) public {
        
        // assert correct zodiac using day and month
        require(isCorrectZodiac(_day, _month), "Wrong Zodiac");

        // construct params string from the transaction inputs
        string memory params = getParams(_day, _month, _year);

        // generate context from contextMessage (constant) and contextAddress (user-defined)
        string memory contextAddressString = string(abi.encodePacked(_contextAddress));
        string memory context = string(abi.encodePacked(contextMessage, contextAddressString));

        // create a claiminfo struct object and send to reclaim for verification
        Claims.ClaimInfo memory claimInfo = Claims.ClaimInfo(_provider, params, context);

        // assertValidSignedClaimAndInfo will revert if either infoHash or Signatures don't match.
        assertValidEpochAndSignedClaimAndInfoHash(_epoch, claimInfo, _claimData, _signatures);

        // mint to _contextAddress

        coinsMinted+=1;
        _mint(_contextAddress, 1000 * (10 ** decimals()));
    }

    // ******* This function needs to be corrected later to use infoHash as the seed and figure out the exact witness ****** //
    function assertWitness(Claims.SignedClaim memory self, ReclaimContractInterface.Witness[] memory _epochWitnesses) internal pure {
        require(self.signatures.length > 0, "No signatures");
		address[] memory signedWitnesses = Claims.recoverSignersOfSignedClaim(self);
        for (uint256 i = 0; i< self.signatures.length; i++)
        {
            bool found = false;
            for (uint j = 0; j < _epochWitnesses.length; j++)
            {
                if (signedWitnesses[i] == _epochWitnesses[j].addr) {
                    found = true;
                    break;
                }
            }
            require(found, "Signature not appropriate");
        }
    }

    function assertValidEpochAndSignedClaimAndInfoHash(uint32 _epoch, Claims.ClaimInfo memory _claimInfo, Claims.CompleteClaimData memory _claimData, bytes[] memory signatures) internal view
    {
        // match the infoHash of the provided parameters
        bytes32 hashed = Claims.hashClaimInfo(_claimInfo);
        require(_claimData.infoHash == hashed);

        // 
        Claims.SignedClaim memory signed = Claims.SignedClaim(_claimData, signatures);

        // fetch witness list from fetchEpoch(_epoch).witnesses
        ReclaimContractInterface.Epoch memory epoch = ReclaimContractInterface(reclaimContractAddress).fetchEpoch(_epoch);
        assertWitness(signed, epoch.witnesses);
    }
}