"""Initial schema: conversations + messages (partitioned) + trigger

Revision ID: 001
Revises:
Create Date: 2026-05-29
"""
from alembic import op

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    # pg_partman and pg_cron are production-only (not in base postgres:16 image)
    op.execute("""
        DO $$ BEGIN
            CREATE EXTENSION IF NOT EXISTS pg_partman SCHEMA partman;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'pg_partman not available — skipping (local dev only)';
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE EXTENSION IF NOT EXISTS pg_cron;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'pg_cron not available — skipping (local dev only)';
        END $$;
    """)

    # asyncpg requires one statement per op.execute() call
    op.execute("CREATE TYPE conversation_status AS ENUM ('active', 'ended', 'migrated')")
    op.execute("""
        CREATE TYPE message_type_enum AS ENUM (
            'text', 'markdown', 'template',
            'user_action', 'context', 'analytics'
        )
    """)
    op.execute("CREATE TYPE sender_type_enum AS ENUM ('user', 'bot', 'system')")
    op.execute("""
        CREATE TYPE message_state_enum AS ENUM (
            'IN_PROGRESS', 'COMPLETED',
            'CANCELLED_BY_USER', 'ERRORED_AT_ML'
        )
    """)
    op.execute("CREATE TYPE transaction_type_enum AS ENUM ('buy', 'rent')")

    op.execute("""
        CREATE TABLE conversations (
            conversation_id  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id          TEXT,
            token_id         TEXT        NOT NULL,
            status           conversation_status NOT NULL DEFAULT 'active',
            created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            turn_count       SMALLINT    NOT NULL DEFAULT 0,
            last_intent      TEXT,
            city             TEXT,
            transaction_type transaction_type_enum,
            preview          TEXT
        )
    """)
    op.execute("""
        CREATE INDEX idx_conversations_user_id
            ON conversations (user_id, updated_at DESC)
            WHERE user_id IS NOT NULL
    """)
    op.execute("""
        CREATE INDEX idx_conversations_token_id
            ON conversations (token_id, updated_at DESC)
    """)

    op.execute("""
        CREATE TABLE messages (
            message_id        UUID               NOT NULL,
            conversation_id   UUID               NOT NULL,
            sender_type       sender_type_enum   NOT NULL,
            message_type      message_type_enum  NOT NULL,
            message_state     message_state_enum NOT NULL DEFAULT 'COMPLETED',
            sequence_number   SMALLINT,
            source_message_id UUID,
            template_id       TEXT,
            request_id        UUID,
            content           JSONB              NOT NULL,
            created_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
            PRIMARY KEY (message_id, created_at)
        ) PARTITION BY RANGE (created_at)
    """)

    # Local dev: create 3 monthly partitions manually (no pg_partman needed locally)
    op.execute("""
        CREATE TABLE messages_2026_05 PARTITION OF messages
            FOR VALUES FROM ('2026-05-01') TO ('2026-06-01')
    """)
    op.execute("""
        CREATE TABLE messages_2026_06 PARTITION OF messages
            FOR VALUES FROM ('2026-06-01') TO ('2026-07-01')
    """)
    op.execute("""
        CREATE TABLE messages_2026_07 PARTITION OF messages
            FOR VALUES FROM ('2026-07-01') TO ('2026-08-01')
    """)

    op.execute("""
        CREATE INDEX idx_messages_conversation_created
            ON messages (conversation_id, created_at DESC)
    """)
    op.execute("""
        CREATE INDEX idx_messages_source_message
            ON messages (source_message_id)
            WHERE source_message_id IS NOT NULL
    """)

    op.execute("""
        CREATE OR REPLACE FUNCTION fn_update_conversation_on_message()
        RETURNS TRIGGER LANGUAGE plpgsql AS $$
        BEGIN
            UPDATE conversations
               SET updated_at  = NEW.created_at,
                   turn_count  = turn_count + CASE
                                     WHEN NEW.sender_type = 'user' THEN 1
                                     ELSE 0
                                 END
             WHERE conversation_id = NEW.conversation_id;
            RETURN NEW;
        END;
        $$
    """)
    op.execute("""
        CREATE TRIGGER trg_messages_update_conversation
            AFTER INSERT ON messages
            FOR EACH ROW EXECUTE FUNCTION fn_update_conversation_on_message()
    """)

    # Production: uncomment and run after pg_partman is available
    # op.execute("""
    #     SELECT partman.create_parent(
    #         p_parent_table => 'public.messages',
    #         p_control      => 'created_at',
    #         p_type         => 'native',
    #         p_interval     => 'monthly',
    #         p_premake      => 3
    #     );
    # """)
    # op.execute("""
    #     UPDATE partman.part_config
    #        SET retention = '90 days', retention_keep_table = FALSE
    #      WHERE parent_table = 'public.messages'
    # """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_messages_update_conversation ON messages")
    op.execute("DROP FUNCTION IF EXISTS fn_update_conversation_on_message")
    op.execute("DROP TABLE IF EXISTS messages CASCADE")
    op.execute("DROP TABLE IF EXISTS conversations CASCADE")
    op.execute("DROP TYPE IF EXISTS transaction_type_enum")
    op.execute("DROP TYPE IF EXISTS message_state_enum")
    op.execute("DROP TYPE IF EXISTS sender_type_enum")
    op.execute("DROP TYPE IF EXISTS message_type_enum")
    op.execute("DROP TYPE IF EXISTS conversation_status")
