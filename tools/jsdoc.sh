#!/bin/bash
D=`dirname $0`
T=`pwd`
cd "$D/../src"
jsdoc -d ../docs .
cd "$T"
