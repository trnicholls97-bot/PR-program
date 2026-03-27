// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "IronLog",
    platforms: [
        .iOS(.v15),
        .macOS(.v12)
    ],
    products: [
        .library(
            name: "IronLog",
            targets: ["IronLog"]
        ),
    ],
    targets: [
        .target(
            name: "IronLog",
            dependencies: [],
            path: "Sources"
        ),
    ]
)
