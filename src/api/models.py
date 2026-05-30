"""SSE event Pydantic models. Aliases emit camelCase JSON over the wire."""
from typing import Any, Dict, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


MessageType  = Literal["text", "markdown", "template", "user_action", "context", "analytics"]
MessageState = Literal["IN_PROGRESS", "COMPLETED"]
SenderType   = Literal["user", "bot", "system"]
SourceState  = Literal["IN_PROGRESS", "COMPLETED", "ERRORED_AT_ML"]


def _to_camel(s: str) -> str:
    parts = s.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


class MessageContent(BaseModel):
    text:          Optional[str]  = None
    template_id:   Optional[str]  = Field(None, alias="templateId")
    data:          Optional[Dict[str, Any]] = None
    derived_label: Optional[str]  = Field(None, alias="derivedLabel")

    model_config = ConfigDict(populate_by_name=True)


class ChatEventToUser(BaseModel):
    conversation_id:      str              = Field(...,  alias="conversationId")
    message_id:           str              = Field(...,  alias="messageId")
    source_message_id:    Optional[str]    = Field(None, alias="sourceMessageId")
    message_type:         MessageType      = Field(...,  alias="messageType")
    message_state:        MessageState     = Field(...,  alias="messageState")
    source_message_state: Optional[SourceState] = Field(None, alias="sourceMessageState")
    created_at:           str              = Field(...,  alias="createdAt")
    sequence_number:      Optional[int]    = Field(None, alias="sequenceNumber")
    response_required:    Optional[bool]   = Field(None, alias="responseRequired")
    is_visible:           Optional[bool]   = Field(None, alias="isVisible")
    sender:               Dict[str, Any]   = Field(...)
    content:              MessageContent   = Field(...)

    model_config = ConfigDict(populate_by_name=True)


class MessageDeltaEventToUser(BaseModel):
    message_id:      str            = Field(...,  alias="messageId")
    source_message_id: str          = Field(...,  alias="sourceMessageId")
    sequence_number: int            = Field(...,  alias="sequenceNumber")
    chunk_index:     int            = Field(...,  alias="chunkIndex")
    message_type:    Optional[str]  = Field(None, alias="messageType")
    content:         Dict[str, str] = Field(...)   # {"text": "<fragment>"}
    chunk_id:        Optional[str]  = Field(None, alias="chunkId")

    model_config = ConfigDict(populate_by_name=True)


class ConnectionAckEvent(BaseModel):
    message_id:    str          = Field(..., alias="messageId")
    message_state: MessageState = Field("IN_PROGRESS", alias="messageState")

    model_config = ConfigDict(populate_by_name=True)


class ErrorEvent(BaseModel):
    code:        str
    message:     str
    recoverable: bool = False

    model_config = ConfigDict(populate_by_name=True)


class OutOfScopeEvent(BaseModel):
    domain_hint: Optional[str] = Field(None, alias="domainHint")

    model_config = ConfigDict(populate_by_name=True)


class ChatEventFromUser(BaseModel):
    conversation_id:  str           = Field(..., alias="conversationId")
    sender:           Dict[str, Any] = Field(...)
    message_type:     MessageType   = Field(..., alias="messageType")
    content:          MessageContent = Field(...)
    response_required: bool         = Field(..., alias="responseRequired")
    is_visible:       Optional[bool] = Field(None, alias="isVisible")
    handoff_context:  Optional[Dict[str, Any]] = Field(None, alias="handoffContext")

    model_config = ConfigDict(populate_by_name=True)


class UserActionPayload(BaseModel):
    action:      str
    property_id: Optional[str]    = Field(None, alias="propertyId")
    seller_id:   Optional[str]    = Field(None, alias="sellerId")
    data:        Optional[Dict[str, Any]] = None

    model_config = ConfigDict(populate_by_name=True)
