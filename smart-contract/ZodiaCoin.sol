// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
// import "./lib/Claims.sol";

interface ReclaimContractInterface {
    struct ClaimInfo {
        string provider;
        string parameters;
        string context;
    }
    function assertValidSignedClaimAndInfoHash(uint256 claimId, ClaimInfo memory claimInfo, bytes[] memory signatures) external view;
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

    function mint(uint256 _claimId, uint256 _day, uint256 _month, uint256 _year, string memory _provider, address _contextAddress, bytes[] memory _signatures) public {
        
        // assert correct zodiac using day and month
        require(isCorrectZodiac(_day, _month), "Wrong Zodiac");

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

        // generate context from contextMessage (constant) and contextAddress (user-defined)
        string memory contextAddressString = string(abi.encodePacked(_contextAddress));
        string memory context = string(abi.encodePacked(contextMessage, contextAddressString));

        // Get the parameter string from DOB.
        string memory params = string(abi.encodePacked("{\"dob\":\"", yearStr, "-", monthStr, "-", dayStr, "\"}"));

        // create a claiminfo struct object and send to reclaim for verification
        // assertValidSignedClaimAndInfo will revert if either infoHash or Signatures don't match.
        ReclaimContractInterface.ClaimInfo memory claimInfo = ReclaimContractInterface.ClaimInfo(_provider, params, context);
        ReclaimContractInterface(reclaimContractAddress).assertValidSignedClaimAndInfoHash(_claimId, claimInfo, _signatures);

        // mint to _contextAddress
        coinsMinted+=1;
        _mint(_contextAddress, 1000 * (10 ** decimals()));
    }
}