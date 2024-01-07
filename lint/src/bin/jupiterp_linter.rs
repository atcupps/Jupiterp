//! This file is part of Jupiterp: https://github.io/atcupps/Jupiterp

//! This is a preliminary style checker designed for .svelte and .ts files
//! Currently checks for ownership tag in file and 80-character limit

use std::process::exit;         // exit program
use std::env::args;             // retrieving commandline args
use std::fs::File;              // file io
use std::io::{prelude::*, BufReader}; 

fn main() {
    let ownership_check = false;
    
    if args().enumerate().count() == 1 {
        print!("usage: jupiterp_linter <filename>\n");
        exit(1);
    }

    // go through all arguments (names of files to read)
    for (idx,fname) in args().enumerate() {
        // skip first argument because its just the name of the program
        if idx == 0 {
            continue;
        }

        // try to read the file
        let file = match File::open(&fname) {
            Err(why) =>  {
                                    print!("Couldn't open file {fname}: {}\n",why);
                                    exit(1)
                                },
            Ok(file) => file
        };

        let reader = BufReader::new(file);

        // for each line read
        for line in reader.lines() {
            // try to read text, if invalid then exit
            let text = match line {
                Err(why) => panic!("Couldn't read line: {}\n",why),
                Ok(text) => text
            };
            
            if text.len() > 80 {
                print!("There are lines over 80 characters long\n");
                exit(1)
            }
        }

        //TODO(28): Create Ownership Check
        // if !ownership_check {
        //     print!("Must verify inclusion of Jupiterp Ownership\n");
        //     exit(1)
        // }
    }

}