# Simulation Project

This project demonstrates two parallel computation methods in Node.js: utilizing the Cluster API and Worker Threads. This README provides instructions on how to set up and run simulations using both methods.

## Getting Started

These instructions will guide you through setting up the project on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 14.x or newer is recommended)
- npm (comes installed with Node.js)

### Installation

Follow these steps to get your development environment running:

1. Clone the repository:

```bash
git clone https://github.com/nitiniitd14/test_trulabs.git
```

2. Navigate to the project directory:

```bash
cd test_trulabs
```

4. Install necessary dependencies:
```bash
npm install
```

## Running Simulations

This project includes simulations using both the Cluster and Worker Threads libraries.

### Using Cluster Implementation
To run simulations leveraging Node.js's Cluster, execute the following command:
```bash
node index.js 1000000
````
Replace 1000000 with the desired number of simulations. This method utilizes multiple CPU cores to perform tasks in parallel.

### Using Worker Threads Implementation
To run simulations using Worker Threads for multi-threaded processing, use the following command:
```bash
node index_1.js 1000000
```
Replace 1000000 with the number of simulations you intend to perform. This method creates multiple threads to handle CPU-bound tasks efficiently.
