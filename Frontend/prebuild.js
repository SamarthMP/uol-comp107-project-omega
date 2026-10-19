// Run by dotnet before build
import { exec } from "child_process";
import fs from "fs";

const log = (msg) => console.log(`[PREBUILD] ${msg}`);

async function main() {
    log("Starting prebuild script...");

    // If node_modules doesn't exist, run npm install
    if (!fs.existsSync("node_modules")) {
        log("node_modules not found, running npm install...");
        
        await new Promise((resolve, reject) => {
            exec("npm install", (error, stdout, stderr) => {
                if (error) {
                    log(`Error running npm install: ${error.message}`);
                    reject(error);
                } else {
                    log("npm install completed successfully.");
                    resolve();
                }   
            });
        });
    }

    // npm run build
    log("Running npm build...");
    await new Promise((resolve, reject) => {
        exec("npm run build", (error, stdout, stderr) => {
            if (error) {
                log(`Error running npm build: ${error.message}`);
                reject(error);
            } else {
                log("npm build completed successfully.");
                resolve();
            }   
        });
    });

    log("Prebuild script completed.");
}

// IMPORTANT: Set the workdir to ../Frontend if the current folder is Backend, otherwise it will run npm install in the wrong directory
if (process.cwd().endsWith("Backend")) {
    process.chdir("../Frontend");
}

main();