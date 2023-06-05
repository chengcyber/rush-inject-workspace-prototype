#!/bin/bash

rm -rf ./**/node_modules

pnpm -v

(cd shared/lib && pnpm i)
(cd team1/app1 && pnpm i)
(cd team1/app2 && pnpm i)
(cd team2/app1 && pnpm i)
(cd team2/app2 && pnpm i)
