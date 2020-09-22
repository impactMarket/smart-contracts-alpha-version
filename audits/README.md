At commit [34e94b2](https://github.com/impactMarket/smart-contracts/commit/34e94b2bc4f485f7543d4477f13c590e24806c83) the results from [MythX](https://mythx.io/) were the following

```json
[
    {
        "issues": [
            {
                "swcID": "SWC-103",
                "swcTitle": "Floating Pragma",
                "description": {
                    "head": "A floating pragma is set.",
                    "tail": "The current pragma Solidity directive is \"\"^0.6.0\"\". It is recommended to specify a fixed compiler version to ensure that the bytecode produced does not vary between builds. This is especially important if you rely on bytecode-level verification of the code."
                },
                "severity": "Low",
                "locations": [
                    {
                        "sourceMap": "39:23:1",
                        "sourceType": "solidity-file",
                        "sourceFormat": "text",
                        "sourceList": [
                            "contracts/Community.sol",
                            "contracts/ImpactMarket.sol",
                            "contracts/interfaces/ICommunity.sol",
                            "contracts/interfaces/ICommunityFactory.sol",
                            "node_modules/@openzeppelin/contracts/GSN/Context.sol",
                            "node_modules/@openzeppelin/contracts/access/AccessControl.sol",
                            "node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol",
                            "node_modules/@openzeppelin/contracts/utils/Address.sol",
                            "node_modules/@openzeppelin/contracts/utils/EnumerableSet.sol"
                        ]
                    }
                ],
                "extra": {
                    "discoveryTime": 884975845,
                    "toolName": "maru"
                },
                "decodedLocations": [
                    [
                        {
                            "line": 2,
                            "column": 0
                        },
                        {
                            "line": 2,
                            "column": 23
                        },
                        false
                    ]
                ]
            }
        ],
        "sourceType": "solidity-file",
        "sourceFormat": "text",
        "sourceList": [
            "contracts/Community.sol",
            "contracts/ImpactMarket.sol",
            "contracts/interfaces/ICommunity.sol",
            "contracts/interfaces/ICommunityFactory.sol",
            "node_modules/@openzeppelin/contracts/GSN/Context.sol",
            "node_modules/@openzeppelin/contracts/access/AccessControl.sol",
            "node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol",
            "node_modules/@openzeppelin/contracts/utils/Address.sol",
            "node_modules/@openzeppelin/contracts/utils/EnumerableSet.sol"
        ],
        "meta": {
            "selectedCompiler": "Unknown",
            "maru": {
                "checks": {
                    "arithmetic_operation": true,
                    "authorization_tx_origin": true,
                    "continue_in_do_while": true,
                    "default_visibility_function": true,
                    "default_visibility_state_variables": true,
                    "deprecated_functions": true,
                    "gas_dos": false,
                    "hardcoded_gas_limit": true,
                    "incorrect_constructor_name": true,
                    "incorrect_erc20_implementation": true,
                    "incorrect_function_state_mutability": true,
                    "lock_pragma": true,
                    "out_of_bounds_array_access": true,
                    "outdated_compiler_version": true,
                    "right_to_left_override": true,
                    "shadowing_builtin_symbols": true,
                    "shadowing_variables": true,
                    "typographical_error": true,
                    "unchecked_call_return_value": true,
                    "uninitialized_storage_pointer": true,
                    "unused_variable": true,
                    "weak_randomness_function": true
                }
            },
            "toolName": "maru",
            "logs": [
                {
                    "level": "info",
                    "msg": "skipped automated fuzz testing due to incompatible bytecode input"
                }
            ]
        }
    }
]
```

At commit [fddc722](https://github.com/impactMarket/smart-contracts/commit/fddc72295d98ee957f6bbfe20b9f6a826548c590) the results from [MythX](https://mythx.io/) were the following

```json
[
    {
        "issues": [
            {
                "swcID": "SWC-103",
                "swcTitle": "Floating Pragma",
                "description": {
                    "head": "A floating pragma is set.",
                    "tail": "The current pragma Solidity directive is \"\"^0.6.0\"\". It is recommended to specify a fixed compiler version to ensure that the bytecode produced does not vary between builds. This is especially important if you rely on bytecode-level verification of the code."
                },
                "severity": "Low",
                "locations": [
                    {
                        "sourceMap": "39:23:1",
                        "sourceType": "solidity-file",
                        "sourceFormat": "text",
                        "sourceList": [
                            "contracts/Community.sol",
                            "contracts/ImpactMarket.sol",
                            "contracts/interfaces/ICommunity.sol",
                            "contracts/interfaces/ICommunityFactory.sol",
                            "node_modules/@openzeppelin/contracts/GSN/Context.sol",
                            "node_modules/@openzeppelin/contracts/access/AccessControl.sol",
                            "node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol",
                            "node_modules/@openzeppelin/contracts/utils/Address.sol",
                            "node_modules/@openzeppelin/contracts/utils/EnumerableSet.sol"
                        ]
                    }
                ],
                "extra": {
                    "discoveryTime": 851806068,
                    "toolName": "maru"
                },
                "decodedLocations": [
                    [
                        {
                            "line": 2,
                            "column": 0
                        },
                        {
                            "line": 2,
                            "column": 23
                        },
                        false
                    ]
                ]
            }
        ],
        "sourceType": "solidity-file",
        "sourceFormat": "text",
        "sourceList": [
            "contracts/Community.sol",
            "contracts/ImpactMarket.sol",
            "contracts/interfaces/ICommunity.sol",
            "contracts/interfaces/ICommunityFactory.sol",
            "node_modules/@openzeppelin/contracts/GSN/Context.sol",
            "node_modules/@openzeppelin/contracts/access/AccessControl.sol",
            "node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol",
            "node_modules/@openzeppelin/contracts/utils/Address.sol",
            "node_modules/@openzeppelin/contracts/utils/EnumerableSet.sol"
        ],
        "meta": {
            "selectedCompiler": "Unknown",
            "maru": {
                "checks": {
                    "arithmetic_operation": true,
                    "authorization_tx_origin": true,
                    "continue_in_do_while": true,
                    "default_visibility_function": true,
                    "default_visibility_state_variables": true,
                    "deprecated_functions": true,
                    "gas_dos": false,
                    "hardcoded_gas_limit": true,
                    "incorrect_constructor_name": true,
                    "incorrect_erc20_implementation": true,
                    "incorrect_function_state_mutability": true,
                    "lock_pragma": true,
                    "out_of_bounds_array_access": true,
                    "outdated_compiler_version": true,
                    "right_to_left_override": true,
                    "shadowing_builtin_symbols": true,
                    "shadowing_variables": true,
                    "typographical_error": true,
                    "unchecked_call_return_value": true,
                    "uninitialized_storage_pointer": true,
                    "unused_variable": true,
                    "weak_randomness_function": true
                }
            },
            "toolName": "maru"
        }
    }
]
```