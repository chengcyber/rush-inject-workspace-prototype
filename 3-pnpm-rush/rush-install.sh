#!/bin/bash

pnpm -v

(cd common/temp && pnpm i)
(cd common/injected/team1 && pnpm i)
(cd common/injected/team2 && pnpm i)