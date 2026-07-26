#!/bin/bash
# Sequential Figma captures — run one at a time to avoid OOM
set -e
cd "$(dirname "$0")/.."
BASE="http://localhost:4321"

capture() {
  local id="$1" url="$2" w="$3" h="$4" label="$5"
  echo ">>> $label"
  timeout 240 node scripts/figma-capture.mjs "$id" "$url" "$w" "$h" "$label" || echo "WARN: $label may have timed out but capture might still process"
  sleep 3
}

# Contact
capture "686fb67d-808d-4b15-84f4-adf8a68f3067" "$BASE/contact/" 390 844 "Contact Mobile"
capture "e37c9169-4068-444e-8cf0-df8666334c9b" "$BASE/contact/" 768 1024 "Contact Tablet"
capture "bdd6242b-e443-4f40-97c8-8f313043fd51" "$BASE/contact/" 1440 900 "Contact Desktop"

# Writing
capture "c679b266-1ee5-4dc4-80ff-97e78c35f9c4" "$BASE/writing/" 390 844 "Writing Mobile"
capture "e7041988-0fac-4d49-af34-8e5f1f57c87d" "$BASE/writing/" 768 1024 "Writing Tablet"
capture "c3ffb273-150f-4791-a22e-d410683fd1f8" "$BASE/writing/" 1440 900 "Writing Desktop"

# Archive
capture "0bdecd16-04ba-4ff7-8207-ad907c8dca75" "$BASE/archive/" 390 844 "Archive Mobile"
capture "255be8d3-4d3f-43a9-ab61-c06896858724" "$BASE/archive/" 768 1024 "Archive Tablet"

echo "Batch 2 triggers done"
