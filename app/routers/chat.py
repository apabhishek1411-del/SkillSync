"""Chat router: conversations, message exchange, and unread counts."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, update
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import User, Conversation, Message
from app.schemas import (
    ConversationCreate, MessageCreate, MessageResponse,
    ConversationResponse, ConversationListResponse
)
from app.utils import get_current_user

chat_router = APIRouter(prefix="/chat", tags=["Chat"])


@chat_router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all conversations for the current user, sorted by last activity. Only shows conversations with at least one message."""
    query = select(Conversation).options(
        selectinload(Conversation.user1),
        selectinload(Conversation.user2),
        selectinload(Conversation.service),
        selectinload(Conversation.messages).selectinload(Message.sender)
    ).where(
        or_(Conversation.user1_id == current_user.id, Conversation.user2_id == current_user.id)
    ).order_by(Conversation.updated_at.desc())
    
    result = await db.execute(query)
    conversations = result.scalars().all()
    
    items = []
    for conv in conversations:
        if not conv.messages:
            continue
        other_user = conv.user2 if conv.user1_id == current_user.id else conv.user1
        last_message = conv.messages[-1] if conv.messages else None
        unread_count = sum(1 for m in conv.messages if not m.is_read and m.sender_id != current_user.id)
        
        items.append(ConversationResponse(
            id=conv.id,
            other_user={"id": other_user.id, "full_name": other_user.full_name, "profile_image": other_user.profile_image} if other_user else None,
            service={"id": conv.service.id, "title": conv.service.title, "thumbnail": conv.service.thumbnail} if conv.service else None,
            last_message=MessageResponse(
                id=last_message.id, conversation_id=last_message.conversation_id,
                sender_id=last_message.sender_id, content=last_message.content,
                is_read=last_message.is_read,
                sender={"id": last_message.sender.id, "full_name": last_message.sender.full_name, "profile_image": last_message.sender.profile_image} if last_message.sender else None,
                created_at=last_message.created_at
            ) if last_message else None,
            unread_count=unread_count,
            created_at=conv.created_at,
            updated_at=conv.updated_at
        ))
    
    return ConversationListResponse(items=items, total=len(items))


@chat_router.post("/conversations", response_model=ConversationResponse)
async def create_or_get_conversation(data: ConversationCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Start a new conversation or return existing one."""
    if data.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot start conversation with yourself")
    
    target = (await db.execute(select(User).where(User.id == data.user_id))).scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing_query = select(Conversation).where(
        or_(
            and_(Conversation.user1_id == current_user.id, Conversation.user2_id == data.user_id),
            and_(Conversation.user1_id == data.user_id, Conversation.user2_id == current_user.id)
        )
    ).order_by(Conversation.created_at.asc()).options(
        selectinload(Conversation.user1),
        selectinload(Conversation.user2),
        selectinload(Conversation.service),
        selectinload(Conversation.messages).selectinload(Message.sender)
    )
    result = await db.execute(existing_query)
    conv = result.scalars().first()
    
    if not conv:
        conv = Conversation(user1_id=current_user.id, user2_id=data.user_id, service_id=data.service_id)
        db.add(conv)
        await db.commit()
        result = await db.execute(
            select(Conversation).options(
                selectinload(Conversation.user1),
                selectinload(Conversation.user2),
                selectinload(Conversation.service),
                selectinload(Conversation.messages).selectinload(Message.sender)
            ).where(Conversation.id == conv.id)
        )
        conv = result.scalar_one()
    
    other_user = conv.user2 if conv.user1_id == current_user.id else conv.user1
    last_message = conv.messages[-1] if conv.messages else None
    unread_count = sum(1 for m in conv.messages if not m.is_read and m.sender_id != current_user.id)
    
    return ConversationResponse(
        id=conv.id,
        other_user={"id": other_user.id, "full_name": other_user.full_name, "profile_image": other_user.profile_image} if other_user else None,
        service={"id": conv.service.id, "title": conv.service.title, "thumbnail": conv.service.thumbnail} if conv.service else None,
        last_message=MessageResponse(
            id=last_message.id, conversation_id=last_message.conversation_id,
            sender_id=last_message.sender_id, content=last_message.content,
            is_read=last_message.is_read,
            sender={"id": last_message.sender.id, "full_name": last_message.sender.full_name, "profile_image": last_message.sender.profile_image} if last_message.sender else None,
            created_at=last_message.created_at
        ) if last_message else None,
        unread_count=unread_count,
        created_at=conv.created_at,
        updated_at=conv.updated_at
    )


@chat_router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def list_messages(
    conversation_id: int,
    page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get messages for a conversation."""
    conv = (await db.execute(select(Conversation).where(Conversation.id == conversation_id))).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.user1_id != current_user.id and conv.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = select(Message).options(selectinload(Message.sender)).where(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    messages = list(reversed(result.scalars().all()))
    return messages


@chat_router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse, status_code=201)
async def send_message(
    conversation_id: int,
    msg_data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a message in a conversation."""
    conv = (await db.execute(select(Conversation).where(Conversation.id == conversation_id))).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.user1_id != current_user.id and conv.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=msg_data.content
    )
    db.add(message)
    conv.updated_at = datetime.utcnow()
    await db.commit()
    
    result = await db.execute(select(Message).options(selectinload(Message.sender)).where(Message.id == message.id))
    return result.scalar_one()


@chat_router.put("/conversations/{conversation_id}/read")
async def mark_as_read(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all messages in a conversation as read."""
    conv = (await db.execute(select(Conversation).where(Conversation.id == conversation_id))).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.user1_id != current_user.id and conv.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.execute(
        update(Message)
        .where(Message.conversation_id == conversation_id, Message.sender_id != current_user.id, Message.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
    return {"message": "Messages marked as read"}


@chat_router.get("/unread-count")
async def get_unread_count(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get total unread message count for the current user."""
    conv_query = select(Conversation.id).where(
        or_(Conversation.user1_id == current_user.id, Conversation.user2_id == current_user.id)
    )
    count = (await db.execute(
        select(func.count(Message.id)).where(
            Message.conversation_id.in_(conv_query),
            Message.sender_id != current_user.id,
            Message.is_read == False
        )
    )).scalar()
    return {"unread_count": count or 0}
