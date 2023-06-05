#!/bin/bash

pnpm -v

(cd app1 && pnpm run build)
(cd app2 && pnpm run build)