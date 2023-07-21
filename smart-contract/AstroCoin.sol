// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
// import "./lib/Claims.sol";

interface ReclaimContractInterface {
    // function witnessWhitelistMap(address signer) external view returns (bool);
    struct ClaimInfo {
        string provider;
        string parameters;
        string context;
    }
    function assertValidSignedClaimAndInfoHash(uint256 claimId, ClaimInfo memory claimInfo, bytes[] memory signatures) external view;
}

contract FactoryAstroCoin {
    address[] public deployedContracts;
    
    constructor(address reclaimContractAddress) {
        // Aries Coin
        AstroCoin AriesCoin = new AstroCoin("Aries", "ARCN", reclaimContractAddress, 321, 420);
        deployedContracts.push(address(AriesCoin));
        // Taurus
        AstroCoin TaurusCoin = new AstroCoin("Taurus", "TACN", reclaimContractAddress, 420, 521);
        deployedContracts.push(address(TaurusCoin));
        // Gemini
        AstroCoin GeminiCoin = new AstroCoin("Gemini", "GECN", reclaimContractAddress, 521, 622);
        deployedContracts.push(address(GeminiCoin));
        // Cancer
        AstroCoin CancerCoin = new AstroCoin("Cancer", "CNCN", reclaimContractAddress, 622, 723);
        deployedContracts.push(address(CancerCoin));
        // Leo
        AstroCoin LeoCoin = new AstroCoin("Leo", "LECN", reclaimContractAddress, 723, 823);
        deployedContracts.push(address(LeoCoin));
        // Virgo
        AstroCoin VirgoCoin = new AstroCoin("Virgo", "VICN", reclaimContractAddress, 823, 923);
        deployedContracts.push(address(VirgoCoin));
        // Libra
        AstroCoin LibraCoin = new AstroCoin("Libra", "LICN", reclaimContractAddress, 923, 1023);
        deployedContracts.push(address(LibraCoin));
        // Scorpio
        AstroCoin ScorpioCoin = new AstroCoin("Scorpio", "SCCN", reclaimContractAddress, 1023, 1122);
        deployedContracts.push(address(ScorpioCoin));
        // Sgittarius
        AstroCoin SagittariusCoin = new AstroCoin("Sagittarius", "SACN", reclaimContractAddress, 1122, 1222);
        deployedContracts.push(address(SagittariusCoin));
        // Capricon
        AstroCoin CapriconCoin = new AstroCoin("Capricon", "CPCN", reclaimContractAddress, 22, 120);
        deployedContracts.push(address(CapriconCoin));
        // Aquarius
        AstroCoin AquariusCoin = new AstroCoin("Aquarius", "AQCN", reclaimContractAddress, 120, 219);
        deployedContracts.push(address(AquariusCoin));
        // Pisces
        AstroCoin PiscesCoin = new AstroCoin("Pisces", "PICN", reclaimContractAddress, 219, 321);
        deployedContracts.push(address(PiscesCoin));
    }

    function getDeployedContracts() public view returns (address[] memory) {
        return deployedContracts;
    }
}

contract AstroCoin is ERC20 {
    uint256 startMMDD;
    uint256 endMMDD;
    address reclaimContractAddress;
    uint32 coinsMinted;

    constructor(string memory name, string memory symbol, address _reclaimContractAddress, uint256 _startMMDD, uint256 _endMMDD) ERC20(name, symbol) {
        // reclaimInterface = ReclaimContractInterface(reclaimContractAddress);
        reclaimContractAddress = _reclaimContractAddress;
        startMMDD = _startMMDD;
        endMMDD = _endMMDD;
    }

    function isCorrectZodiac(uint256 _day, uint256 _month) internal view returns (bool){
        uint256 dayOfYearMMDD = _month*100 + _day;
        if (startMMDD <= dayOfYearMMDD && dayOfYearMMDD < endMMDD) {
            return true;
        }
        return false;
    }

    function mint(uint256 _claimId, uint256 _day, uint256 _month, uint256 _year, string memory _provider, string memory _context, bytes[] memory _signatures) public {
        // address witness = Claims.recoverSigner(proof.signedClaim);
        // require(reclaimInterface.witnessWhitelistMap(witness));

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

        // Get the parameter string from DOB.
        string memory params = string(abi.encodePacked("{\"dob\":\"", yearStr, "-", monthStr, "-", dayStr, "\"}"));
        ReclaimContractInterface.ClaimInfo memory claimInfo = ReclaimContractInterface.ClaimInfo(_provider, params, _context);
        ReclaimContractInterface(reclaimContractAddress).assertValidSignedClaimAndInfoHash(_claimId, claimInfo, _signatures);
        coinsMinted+=1;
        _mint(msg.sender, 1000);
    }
}