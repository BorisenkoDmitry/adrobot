"""Persist campaign stream drafts, archives and pinned shares."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0002_stream_edits"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "stream_edits",
        sa.Column("campaign_id", sa.Integer(), nullable=False),
        sa.Column("stream_id", sa.Integer(), nullable=False),
        sa.Column("published", postgresql.JSONB(), nullable=False),
        sa.Column("remote_offers", postgresql.JSONB(), nullable=False),
        sa.Column("draft", postgresql.JSONB(none_as_null=True), nullable=True),
        sa.Column("revision", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.Column("conflicted", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.CheckConstraint("revision > 0", name=op.f("ck_stream_edits_positive_revision")),
        sa.PrimaryKeyConstraint("campaign_id", "stream_id", name=op.f("pk_stream_edits")),
    )


def downgrade() -> None:
    op.drop_table("stream_edits")
