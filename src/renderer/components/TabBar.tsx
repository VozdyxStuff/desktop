// Copyright (c) 2015-2016 Yuya Ochiai
// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React from 'react';
import type {DraggingStyle, DropResult, NotDraggingStyle} from 'react-beautiful-dnd';
import {DragDropContext, Draggable, Droppable} from 'react-beautiful-dnd';
import type {IntlShape} from 'react-intl';
import {injectIntl} from 'react-intl';

import type {UniqueView} from 'types/config';

type Props = {
    activeTabId?: string;
    activeServerId?: string;
    id: string;
    isDarkMode: boolean;
    onSelect: (id: string) => void;
    onCloseTab: (id: string) => void;
    onNewTab?: () => void;
    tabs: UniqueView[];
    sessionsExpired: Record<string, boolean>;
    unreadCounts: Record<string, boolean>;
    mentionCounts: Record<string, number>;
    onDrop: (result: DropResult) => void;
    tabsDisabled?: boolean;
    isMenuOpen?: boolean;
    intl: IntlShape;
};

type State = {
    nonce?: string;
}

function getStyle(style?: DraggingStyle | NotDraggingStyle) {
    if (style?.transform) {
        const axisLockX = `${style.transform.slice(0, style.transform.indexOf(','))}, 0px)`;
        return {
            ...style,
            transform: axisLockX,
        };
    }
    return style;
}

class TabBar extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {};
    }

    onCloseTab = (id: string) => {
        return (event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            this.props.onCloseTab(id);
        };
    };

    componentDidMount(): void {
        window.desktop.getNonce().then((nonce) => {
            this.setState({
                nonce,
            });
        });
    }

    render() {
        if (!this.state.nonce) {
            return null;
        }

        const tabs = this.props.tabs.map((tab, index) => {
            const sessionExpired = this.props.sessionsExpired[tab.id!];
            const hasUnreads = this.props.unreadCounts[tab.id!];

            let mentionCount = 0;
            if (this.props.mentionCounts[tab.id!] > 0) {
                mentionCount = this.props.mentionCounts[tab.id!];
            }

            let badgeDiv: React.ReactNode;
            if (sessionExpired) {
                badgeDiv = (
                    <div className='TabBar-expired'>
                        <i className='icon-alert-circle-outline'/>
                    </div>
                );
            } else if (mentionCount !== 0) {
                badgeDiv = (
                    <div className='TabBar-badge'>
                        <span>{mentionCount}</span>
                    </div>
                );
            } else if (hasUnreads) {
                badgeDiv = (
                    <div className='TabBar-dot'/>
                );
            }

            return (
                <Draggable
                    key={tab.id}
                    draggableId={`serverTabItem-${tab.id}`}
                    index={index}
                    isDragDisabled={this.props.tabsDisabled || this.props.isMenuOpen}
                >
                    {(provided, snapshot) => {
                        return (
                            <li
                                ref={provided.innerRef}
                                id={`serverTabItem${index}`}
                                draggable={false}
                                title={tab.pageTitle || tab.server.name}
                                className={classNames('serverTabItem', {
                                    active: this.props.activeTabId === tab.id,
                                    dragging: snapshot.isDragging,
                                })}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={getStyle(provided.draggableProps.style)}
                            >
                                <a
                                    draggable={false}
                                    onClick={() => {
                                        if (!this.props.tabsDisabled) {
                                            this.props.onSelect(tab.id!);
                                        }
                                    }}
                                    className={classNames({
                                        disabled: this.props.tabsDisabled,
                                    })}
                                >
                                    <div className='TabBar-tabSeperator'>
                                        <span>{tab.pageTitle || tab.server.name}</span>
                                        {badgeDiv}
                                        {this.props.tabs.length > 1 && (
                                            <button
                                                className='serverTabItem__close'
                                                onClick={this.onCloseTab(tab.id!)}
                                            >
                                                <i className='icon-close'/>
                                            </button>
                                        )}
                                    </div>
                                </a>
                            </li>
                        );
                    }}
                </Draggable>
            );
        });

        return (
            <DragDropContext
                nonce={this.state.nonce}
                onDragEnd={this.props.onDrop}
            >
                <Droppable
                    isDropDisabled={this.props.tabsDisabled}
                    droppableId='tabBar'
                    direction='horizontal'
                >
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            className={classNames('TabBar', {
                                darkMode: this.props.isDarkMode,
                                disabled: this.props.tabsDisabled,
                            })}
                            id={this.props.id}
                            {...provided.droppableProps}
                        >
                            {tabs}
                            <button
                                className={classNames('TabBar-addTab', {
                                    darkMode: this.props.isDarkMode,
                                })}
                                onClick={this.props.onNewTab}
                                disabled={this.props.tabsDisabled}
                            >
                                <i className='icon-plus'/>
                            </button>
                            {this.props.isMenuOpen ? <span className='TabBar-nonDrag'/> : null}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        );
    }
}

export default injectIntl(TabBar);
