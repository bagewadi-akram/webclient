import React from 'react';
import { TYPE, LABEL } from './resultContainer.jsx';
import { Avatar, ContactPresence, LastActivity, MembersAmount } from '../contacts.jsx';
import { MegaRenderMixin } from '../../mixins';
import { Emoji, ParsedHTML } from '../../../ui/utils.jsx';
import { ContactAwareName } from '../contacts.jsx';
import { EVENTS } from './searchPanel.jsx';

const SEARCH_ROW_CLASS = `result-table-row`;
const USER_CARD_CLASS = `user-card`;

/**
 * roomIsGroup
 * @description Check whether given chat room is group chat.
 * @param {ChatRoom} room
 * @returns {Boolean}
 */

const roomIsGroup = room => room && room.type === 'group' || room.type === 'public';

/**
 * openResult
 * @description Invoked on result click, opens the respective chat room; instantiates new chat room if none is already
 * available. The root component is notified for the interaction via the `chatSearchResultOpen` event trigger.
 * @see SearchPanel.bindEvents()
 * @param {ChatRoom|String} room room or userId
 * @param {String} [messageId]
 * @param {Number} [index]
 */

const openResult = (room, messageId, index) => {
    document.dispatchEvent(new Event(EVENTS.RESULT_OPEN));

    if (isString(room)) {
        loadSubPage('fm/chat/p/' + room);
    }
    else if (room && room.chatId && !messageId) {
        // Chat room matched -> open chat room
        const chatRoom = megaChat.getChatById(room.chatId);
        if (chatRoom) {
            loadSubPage(chatRoom.getRoomUrl());
        }
        else {
            // No chat room -> instantiate new chat room
            megaChat.openChat([u_handle, room.chatId], 'private', undefined, undefined, undefined, true);
        }
    }
    else {
        loadSubPage(room.getRoomUrl());
        if (messageId) {
            room.scrollToMessageId(messageId, index);
        }
    }
};

//
// MessageRow
// ---------------------------------------------------------------------------------------------------------------------

class MessageRow extends MegaRenderMixin {
    constructor(props) {
        super(props);
    }

    render() {
        const { data, matches, room, index } = this.props;
        const isGroup = room && roomIsGroup(room);
        const contact = room.getParticipantsExceptMe();
        const summary = data.renderableSummary || room.messagesBuff.getRenderableSummary(data);

        return (
            <div
                className={`${SEARCH_ROW_CLASS} message`}
                onClick={() => openResult(room, data.messageId, index)}>
                <div className="message-result-avatar">
                    {isGroup ?
                        <div className="chat-topic-icon">
                            <i className="sprite-fm-uni icon-chat-group"/>
                        </div> :
                        <Avatar contact={M.u[contact]}/>}
                </div>
                <div className="user-card">
                    <span className="title">
                        <ContactAwareName contact={M.u[contact]}>
                            <Emoji>{room.getRoomTitle()}</Emoji>
                        </ContactAwareName>
                    </span>
                    {isGroup ? null : <ContactPresence contact={M.u[contact]}/>}
                    <div className="clear"/>
                    <div className="message-result-info">
                        <div className="summary">
                            <ParsedHTML content={megaChat.highlight(summary, matches, true)} />
                        </div>
                        <div className="result-separator">
                            <i className="sprite-fm-mono icon-dot"/>
                        </div>
                        <span className="date">
                            {getTimeMarker(data.delay, true)}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
}

//
// ChatRow
// ---------------------------------------------------------------------------------------------------------------------

class ChatRow extends MegaRenderMixin {
    constructor(props) {
        super(props);
    }

    render() {
        const { room, matches } = this.props;
        const result = megaChat.highlight(megaChat.html(room.topic), matches, true);

        return (
            <div
                className={SEARCH_ROW_CLASS}
                onClick={() => openResult(room)}>
                <div className="chat-topic-icon">
                    <i className="sprite-fm-uni icon-chat-group"/>
                </div>
                <div className={USER_CARD_CLASS}>
                    <div className="graphic">
                        <ParsedHTML>{result}</ParsedHTML>
                    </div>
                </div>
                <div className="clear"/>
            </div>
        );
    }
}

//
// MemberRow
// ---------------------------------------------------------------------------------------------------------------------

class MemberRow extends MegaRenderMixin {
    constructor(props) {
        super(props);
    }

    render() {
        const { data, matches, room, contact } = this.props;
        const hasHighlight = matches && !!matches.length;
        const isGroup = room && roomIsGroup(room);
        const userCard = {
            graphic: (
                // `Graphic` result of member type -- the last activity status is shown as graphic icon
                <div className="graphic">
                    {isGroup ?
                        <ParsedHTML>
                            {megaChat.highlight(megaChat.html(room.topic || room.getRoomTitle()), matches, true)}
                        </ParsedHTML> :
                        <>
                            <ParsedHTML>
                                {megaChat.highlight(megaChat.html(nicknames.getNickname(data)), matches, true)}
                            </ParsedHTML>
                            <ContactPresence contact={contact}/>
                        </>
                    }
                </div>
            ),
            textual: (
                // `Textual` result of member type -- last activity as plain text
                <div className="textual">
                    {isGroup ?
                        <>
                            <span>
                                <Emoji>{room.topic || room.getRoomTitle()}</Emoji>
                            </span>
                            <MembersAmount room={room}/>
                        </> :
                        <>
                            <Emoji>{nicknames.getNickname(data)}</Emoji>
                            <LastActivity contact={contact} showLastGreen={true}/>
                        </>
                    }
                </div>
            )
        };

        return (
            <div
                className={SEARCH_ROW_CLASS}
                onClick={() => openResult(room ? room : contact.h)}>
                {isGroup ?
                    <div className="chat-topic-icon">
                        <i className="sprite-fm-uni icon-chat-group"/>
                    </div> :
                    <Avatar contact={contact}/>}
                <div className={USER_CARD_CLASS}>
                    {userCard[hasHighlight ? 'graphic' : 'textual']}
                </div>
                <div className="clear"/>
            </div>
        );
    }
}

const NilRow = ({ onSearchMessages, isFirstQuery }) => (
    <div className={`${SEARCH_ROW_CLASS} nil`}>
        <div className="nil-container">
            <i className="sprite-fm-mono icon-preview-reveal"/>
            <span>{LABEL.NO_RESULTS}</span>
            {isFirstQuery && (
                <div
                    className="search-messages"
                    onClick={onSearchMessages}>
                    <ParsedHTML
                        tag="div"
                        content={LABEL.SEARCH_MESSAGES_INLINE.replace('[A]', '<a>').replace('[/A]', '</a>')}
                    />
                </div>
            )}
        </div>
    </div>
);

// ---------------------------------------------------------------------------------------------------------------------

export default class ResultRow extends MegaRenderMixin {
    constructor(props) {
        super(props);
    }

    render() {
        const { type, result, children, onSearchMessages, isFirstQuery } = this.props;

        switch (type) {
            case TYPE.MESSAGE:
                return (
                    <MessageRow
                        data={result.data}
                        index={result.index}
                        matches={result.matches}
                        room={result.room}/>
                );
            case TYPE.CHAT:
                return <ChatRow room={result.room} matches={result.matches}/>;
            case TYPE.MEMBER:
                return (
                    <MemberRow
                        data={result.data}
                        matches={result.matches}
                        room={result.room}
                        contact={M.u[result.data]}/>
                );
            case TYPE.NIL:
                return <NilRow onSearchMessages={onSearchMessages} isFirstQuery={isFirstQuery}/>;
            default:
                return (
                    <div className={SEARCH_ROW_CLASS}>
                        {children}
                    </div>
                );
        }
    }
}
