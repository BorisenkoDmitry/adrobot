"""Record confirmed changes to campaign streams."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0003_stream_publications"
down_revision = "0002_stream_edits"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "stream_publications",
        sa.Column("id", sa.BigInteger(), sa.Identity(), nullable=False),
        sa.Column("campaign_id", sa.Integer(), nullable=False),
        sa.Column("stream_id", sa.Integer(), nullable=False),
        sa.Column("stream_name", sa.Text(), nullable=False),
        sa.Column(
            "published_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("clock_timestamp()"),
            nullable=False,
        ),
        sa.Column("changes", postgresql.JSONB(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_stream_publications")),
    )
    op.create_index(
        "ix_stream_publications_campaign_id_id", "stream_publications", ["campaign_id", "id"]
    )


def downgrade() -> None:
    op.drop_table("stream_publications")
