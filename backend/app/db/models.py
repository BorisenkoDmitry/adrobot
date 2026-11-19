from app.db.base import Base
from app.modules.editor.model import StreamEdit, StreamPublication

__all__ = ["StreamEdit", "StreamPublication", "target_metadata"]

target_metadata = Base.metadata
