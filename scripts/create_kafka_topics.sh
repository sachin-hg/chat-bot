#!/usr/bin/env bash
# Creates all required Kafka topics. Idempotent — safe to run multiple times.
# Usage: ./scripts/create_kafka_topics.sh [bootstrap-server]
# Default bootstrap server: localhost:9092

set -euo pipefail

BOOTSTRAP="${1:-localhost:9092}"

create_topic() {
    local topic="$1" partitions="$2" replication="$3"
    if kafka-topics.sh --bootstrap-server "$BOOTSTRAP" --describe --topic "$topic" &>/dev/null; then
        echo "  [exists]  $topic"
    else
        kafka-topics.sh --bootstrap-server "$BOOTSTRAP" \
            --create --topic "$topic" \
            --partitions "$partitions" \
            --replication-factor "$replication"
        echo "  [created] $topic  (partitions=$partitions, replication=$replication)"
    fi
}

echo "Creating Kafka topics on $BOOTSTRAP ..."
# NOTE: replication-factor=1 for local single-broker.
# Production: set to 3 and add --config min.insync.replicas=2
create_topic chat.messages       12 1
create_topic chat.session_events  6 1
create_topic chat.metrics         6 1
create_topic chat.llm_summaries   3 1
echo "Done."
