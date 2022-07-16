import React from 'react';

import {NavigationTreeState, NavigationTreeNodeType, NavigationTreeProps} from './types';
import {NavigationTreeAction, NavigationTreeActionType} from './state';

import {DatabaseIcon} from '../icons/Database';
import {FolderIcon} from '../icons/Folder';
import {FolderOpenIcon} from '../icons/FolderOpen';
import {TableIcon} from '../icons/Table';
import {TreeView} from '../TreeView/TreeView';

export interface NavigationTreeNodeProps {
    path: string;
    fetchPath: NavigationTreeProps['fetchPath'];
    activePath?: string;
    state: NavigationTreeState;
    level?: number;
    dispatch: React.Dispatch<NavigationTreeAction>;
    children?: React.ReactNode;
    onActivate?: (path: string) => void;
    getActions?: NavigationTreeProps['getActions'];
    cache?: boolean;
}

function renderIcon(type: NavigationTreeNodeType | string, collapsed: boolean) {
    switch (type) {
        case 'database':
            return <DatabaseIcon height={14} />;
        case 'directory':
        case 'index':
            return collapsed ? <FolderIcon height={14} /> : <FolderOpenIcon height={14} />;
        case 'table':
        case 'index_table':
            return <TableIcon height={14} />;
        default:
            return null;
    }
}

export function NavigationTreeNode({
    path,
    fetchPath,
    activePath,
    state,
    level,
    dispatch,
    children,
    onActivate,
    getActions,
    cache,
}: NavigationTreeNodeProps) {
    const nodeState = state[path];

    React.useEffect(() => {
        if (nodeState.collapsed) {
            if (!cache) {
                dispatch({
                    type: NavigationTreeActionType.ResetNode,
                    payload: {path},
                });
            }

            return;
        }

        if (nodeState.loaded || nodeState.loading) {
            return;
        }

        dispatch({
            type: NavigationTreeActionType.StartLoading,
            payload: {path},
        });

        fetchPath(path)
            .then((data) => {
                dispatch({
                    type: NavigationTreeActionType.FinishLoading,
                    payload: {path, activePath, data},
                });
            })
            .catch((error) => {
                dispatch({
                    type: NavigationTreeActionType.FinishLoading,
                    payload: {path, error},
                });
            });
    }, [nodeState.collapsed]);

    const handleClick = React.useCallback(() => {
        if (onActivate) {
            onActivate(path);
        }
    }, [path, onActivate]);

    const handleArrowClick = React.useCallback(() => {
        dispatch({type: NavigationTreeActionType.ToggleCollapsed, payload: {path}});
    }, []);

    const actions = React.useMemo(() => {
        return getActions?.(nodeState.path, nodeState.type);
    }, [getActions, nodeState]);

    return (
        <TreeView
            name={nodeState.name}
            icon={renderIcon(nodeState.type, nodeState.collapsed)}
            collapsed={nodeState.collapsed}
            active={nodeState.path === activePath}
            actions={actions}
            hasArrow={nodeState.expandable}
            onClick={handleClick}
            onArrowClick={handleArrowClick}
            level={level}
        >
            {children}
        </TreeView>
    );
}
