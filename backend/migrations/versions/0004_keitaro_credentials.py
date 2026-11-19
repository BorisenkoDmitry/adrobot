"""Store an encrypted Keitaro key for the installation."""

import sqlalchemy as sa
from alembic import op

revision = "0004_keitaro_credentials"
down_revision = "0003_stream_publications"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "keitaro_credentials",
        sa.Column("id", sa.SmallInteger(), nullable=False),
        sa.Column("encrypted_api_key", sa.Text(), nullable=False),
        sa.CheckConstraint("id = 1", name=op.f("ck_keitaro_credentials_singleton")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_keitaro_credentials")),
    )


def downgrade() -> None:
    op.drop_table("keitaro_credentials")
