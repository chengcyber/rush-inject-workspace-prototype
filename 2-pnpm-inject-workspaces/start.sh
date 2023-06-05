#!/bin/bash

pnpm -v

(cd team1 && pnpm -r run start)
(cd team2 && pnpm -r run start)
