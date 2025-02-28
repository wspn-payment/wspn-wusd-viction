 //SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract VRC25Proxy is ERC1967Proxy{

    constructor(address logic, bytes memory data) ERC1967Proxy(logic, data) {}

}