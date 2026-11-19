from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    Identity,
    Index,
    Integer,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class StreamEdit(Base):
    __tablename__ = "stream_edits"
    __table_args__ = (CheckConstraint("revision > 0", name="positive_revision"),)

    campaign_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    stream_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    published: Mapped[list[dict]] = mapped_column(JSONB, nullable=False)
    remote_offers: Mapped[list[dict]] = mapped_column(JSONB, nullable=False)
    draft: Mapped[list[dict] | None] = mapped_column(JSONB(none_as_null=True))
    revision: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    conflicted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))


class StreamPublication(Base):
    __tablename__ = "stream_publications"
    __table_args__ = (Index("ix_stream_publications_campaign_id_id", "campaign_id", "id"),)

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    campaign_id: Mapped[int] = mapped_column(Integer, nullable=False)
    stream_id: Mapped[int] = mapped_column(Integer, nullable=False)
    stream_name: Mapped[str] = mapped_column(Text, nullable=False)
    published_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.clock_timestamp()
    )
    changes: Mapped[list[dict]] = mapped_column(JSONB, nullable=False)
