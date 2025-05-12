import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  FaClock,
  FaGripVertical,
  FaLightbulb,
  FaLock,
  FaMoon,
  FaShare,
  FaSmile,
  FaSun,
  FaThumbsDown,
  FaThumbsUp,
  FaTools,
  FaTrash
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../firebase';

// Import DND Kit
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
const SortableItem = ({ id, item, columnId, handleReaction, deleteItem, addAction, user }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`item ${item.isNew ? 'item-new' : ''} ${isDragging ? 'is-dragging' : ''}`}
    >
      <div className="item-content">
        <div
          className="item-drag-handle"
          {...attributes}
          {...listeners}
        >
          <FaGripVertical />
        </div>
        <p>{item.text}</p>
      </div>
      <div className="item-actions">
        <div className="reaction-buttons">
          <button
            onClick={() => handleReaction(columnId, item.id, 'like')}
            className={`reaction-button like-button ${item.reactions && item.reactions[user.uid] ? 'active' : ''}`}
          >
            <FaThumbsUp />
            <span>{Object.keys(item.reactions || {}).length}</span>
          </button>
          <button
            onClick={() => handleReaction(columnId, item.id, 'dislike')}
            className={`reaction-button dislike-button ${item.dislikes && item.dislikes[user.uid] ? 'active' : ''}`}
          >
            <FaThumbsDown />
            <span>{Object.keys(item.dislikes || {}).length}</span>
          </button>
          <button
            onClick={() => addAction(columnId, item.id)}
            className="action-button"
            title="Add Action Item"
          >
            <FaTools />
          </button>
        </div>
        {item.createdBy === user.uid && (
          <button
            onClick={() => deleteItem(columnId, item.id)}
            className="delete-button"
          >
            <FaTrash />
          </button>
        )}
      </div>
        {item.action && <p className="item-action"><strong>Action:</strong> {item.action}</p>}

    </div>
  );
};

const RetroBoard = ({ user }) => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState({ text: '', columnId: 'went-well' }); // Default to "What Went Well"
  const [shareUrl, setShareUrl] = useState('');
  // Use theme from context instead of local state
  const { theme, toggleTheme } = useTheme();
  const [activeId, setActiveId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [contentVisible, setContentVisible] = useState(true);
  const timerRef = useRef(null);
  const [actionItem, setActionItem] = useState({ columnId: '', itemId: '', text: '' });
  const [showActionModal, setShowActionModal] = useState(false);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const boardRef = doc(db, 'boards', boardId);
        const boardDoc = await getDoc(boardRef);

        if (!boardDoc.exists()) {
          setError('Board not found');
          return;
        }

        // Set up real-time listener
        const unsubscribe = onSnapshot(boardRef, (doc) => {
          if (doc.exists()) {
            const boardData = doc.data();
            setBoard({ id: doc.id, ...boardData });

            // Check timer settings
            if (boardData.timerSettings && boardData.timerSettings.enabled) {
              const { startTime, duration, visible } = boardData.timerSettings;

              // If content is already visible, show it
              if (visible) {
                setContentVisible(true);
                setTimeRemaining(null);
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                }
              } else {
                // Calculate time remaining
                const startTimeDate = startTime?.toDate() || new Date();
                const endTimeMs = startTimeDate.getTime() + (duration * 60 * 1000);
                const currentTimeMs = new Date().getTime();
                const remainingMs = endTimeMs - currentTimeMs;

                if (remainingMs <= 0) {
                  // Timer has expired, make content visible
                  setContentVisible(true);
                  setTimeRemaining(null);

                  // Update the board to mark content as visible
                  updateDoc(boardRef, {
                    'timerSettings.visible': true
                  }).catch(err => console.error('Error updating timer visibility:', err));

                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                  }
                } else {
                  // Timer still running
                  setContentVisible(false);
                  setTimeRemaining(Math.ceil(remainingMs / 1000));

                  // Set up interval to update timer
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                  }

                  timerRef.current = setInterval(() => {
                    setTimeRemaining(prev => {
                      if (prev <= 1) {
                        // Timer expired
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                        setContentVisible(true);

                        // Update the board to mark content as visible
                        updateDoc(boardRef, {
                          'timerSettings.visible': true
                        }).catch(err => console.error('Error updating timer visibility:', err));

                        return null;
                      }
                      return prev - 1;
                    });
                  }, 1000);
                }
              }
            } else {
              // No timer settings or timer disabled
              setContentVisible(true);
              setTimeRemaining(null);
            }

            setLoading(false);
          } else {
            setError('Board no longer exists');
            navigate('/');
          }
        });

        // Generate share URL
        const boardData = boardDoc.data();
        setShareUrl(`${window.location.origin}/join?code=${boardData.joinCode}`);

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching board:', error);
        setError('Failed to load board');
        setLoading(false);
      }
    };

    fetchBoard();

    // Clean up timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [boardId, navigate]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) return;

    // Extract the item ID and column ID from the active and over IDs
    const [activeItemId, activeColumnId] = active.id.split('::');
    const [overItemId, overColumnId] = over.id.split('::');

    // Clone the current board state
    const updatedBoard = { ...board };

    // Check if dropping on an empty column placeholder
    if (overItemId === 'empty') {
      // Moving from a column to an empty column
      const sourceColumn = updatedBoard.columns[activeColumnId];
      const destColumn = updatedBoard.columns[overColumnId];

      // Find the item to move
      const sourceItems = Array.from(sourceColumn.items);
      const sourceIndex = sourceItems.findIndex(item => item.id === activeItemId);

      // Get the item to move
      const [movedItem] = sourceItems.splice(sourceIndex, 1);

      // Add the item to the empty destination column
      const destItems = Array.from(destColumn.items || []);
      destItems.push(movedItem);

      // Update the columns
      updatedBoard.columns[activeColumnId].items = sourceItems;
      updatedBoard.columns[overColumnId].items = destItems;

      // Update the board in Firestore
      try {
        await updateDoc(doc(db, 'boards', boardId), {
          columns: updatedBoard.columns
        });
      } catch (error) {
        console.error('Error updating board:', error);
      }
    }
    // If the item was dropped in a different position
    else if (activeItemId !== overItemId) {
      // If moving within the same column
      if (activeColumnId === overColumnId) {
        const column = updatedBoard.columns[activeColumnId];
        const items = Array.from(column.items);

        // Find the indices of the items
        const activeIndex = items.findIndex(item => item.id === activeItemId);
        const overIndex = items.findIndex(item => item.id === overItemId);

        // Reorder the items
        updatedBoard.columns[activeColumnId].items = arrayMove(
          items,
          activeIndex,
          overIndex
        );
      } else {
        // Moving from one column to another
        const sourceColumn = updatedBoard.columns[activeColumnId];
        const destColumn = updatedBoard.columns[overColumnId];

        // Find the indices of the items
        const sourceItems = Array.from(sourceColumn.items);
        const destItems = Array.from(destColumn.items);
        const sourceIndex = sourceItems.findIndex(item => item.id === activeItemId);
        const destIndex = destItems.findIndex(item => item.id === overItemId);

        // Get the item to move
        const [movedItem] = sourceItems.splice(sourceIndex, 1);

        // Insert the item at the destination
        destItems.splice(destIndex, 0, movedItem);

        // Update the columns
        updatedBoard.columns[activeColumnId].items = sourceItems;
        updatedBoard.columns[overColumnId].items = destItems;
      }

      // Update the board in Firestore
      try {
        await updateDoc(doc(db, 'boards', boardId), {
          columns: updatedBoard.columns
        });
      } catch (error) {
        console.error('Error updating board:', error);
      }
    }

    setActiveId(null);
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.text.trim() || !newItem.columnId) return;

    try {
      // Clone the current board state
      const updatedBoard = { ...board };
      const column = updatedBoard.columns[newItem.columnId];

      // Create new item
      const item = {
        id: uuidv4(),
        text: newItem.text,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        reactions: {},
        isNew: true // Flag for animation
      };

      // Add item to column
      column.items.push(item);

      // Update the board in Firestore
      await updateDoc(doc(db, 'boards', boardId), {
        columns: updatedBoard.columns
      });

      // Reset form but keep the selected column
      setNewItem({ text: '', columnId: 'went-well' });

      // Remove the isNew flag after animation completes
      setTimeout(async () => {
        try {
          const currentBoardRef = doc(db, 'boards', boardId);
          const currentBoardDoc = await getDoc(currentBoardRef);

          if (currentBoardDoc.exists()) {
            const currentBoard = currentBoardDoc.data();
            const currentColumn = currentBoard.columns[newItem.columnId];

            // Find the item and remove the isNew flag
            const itemIndex = currentColumn.items.findIndex(i => i.id === item.id);

            if (itemIndex !== -1) {
              currentColumn.items[itemIndex].isNew = false;

              await updateDoc(currentBoardRef, {
                columns: currentBoard.columns
              });
            }
          }
        } catch (error) {
          console.error('Error updating animation flag:', error);
        }
      }, 1000); // 1 second animation
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleReaction = async (columnId, itemId, reactionType = 'like') => {
    try {
      // Clone the current board state
      const updatedBoard = { ...board };
      const column = updatedBoard.columns[columnId];
      const itemIndex = column.items.findIndex(item => item.id === itemId);

      if (itemIndex === -1) return;

      const item = column.items[itemIndex];

      // Initialize reactions object structure if needed
      if (!item.reactions) {
        item.reactions = {};
      }

      if (!item.dislikes) {
        item.dislikes = {};
      }

      // Handle reaction based on type
      if (reactionType === 'like') {
        // Toggle like reaction for current user
        if (item.reactions[user.uid]) {
          delete item.reactions[user.uid];
        } else {
          item.reactions[user.uid] = true;
          // Remove dislike if exists
          if (item.dislikes[user.uid]) {
            delete item.dislikes[user.uid];
          }
        }
      } else if (reactionType === 'dislike') {
        // Toggle dislike reaction for current user
        if (item.dislikes[user.uid]) {
          delete item.dislikes[user.uid];
        } else {
          item.dislikes[user.uid] = true;
          // Remove like if exists
          if (item.reactions[user.uid]) {
            delete item.reactions[user.uid];
          }
        }
      }

      // Update the board in Firestore
      await updateDoc(doc(db, 'boards', boardId), {
        columns: updatedBoard.columns
      });
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  const deleteItem = async (columnId, itemId) => {
    try {
      // Clone the current board state
      const updatedBoard = { ...board };
      const column = updatedBoard.columns[columnId];
      const itemIndex = column.items.findIndex(item => item.id === itemId);

      if (itemIndex === -1) return;

      // Remove item from column
      column.items.splice(itemIndex, 1);

      // Update the board in Firestore
      await updateDoc(doc(db, 'boards', boardId), {
        columns: updatedBoard.columns
      });
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const addAction = (columnId, itemId) => {
    // Find the current action text if it exists
    const column = board.columns[columnId];
    const item = column.items.find(item => item.id === itemId);
    const currentAction = item.action || '';
    
    setActionItem({ columnId, itemId, text: currentAction });
    setShowActionModal(true);
  };

  const saveAction = async () => {
    try {
      // Clone the current board state
      const updatedBoard = { ...board };
      const column = updatedBoard.columns[actionItem.columnId];
      const itemIndex = column.items.findIndex(item => item.id === actionItem.itemId);

      if (itemIndex === -1) return;

      // Update the item with the action
      column.items[itemIndex].action = actionItem.text;

      // Update the board in Firestore
      await updateDoc(doc(db, 'boards', boardId), {
        columns: updatedBoard.columns
      });

      // Close the modal
      setShowActionModal(false);
    } catch (error) {
      console.error('Error saving action:', error);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  // Theme toggle is now handled by the ThemeContext

  if (loading) {
    return <div className="loading">Loading board...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="retro-board">
      <header className="board-header">
        <h1>{board.name}</h1>
        <div className="board-actions">
          {timeRemaining !== null && (
            <div className="timer-display">
              <FaClock />
              <span>
                Content will be visible in: {Math.floor(timeRemaining / 60)}:
                {(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
          <button onClick={toggleTheme} className="theme-toggle-button">
            {theme === 'cyberpunk' ? <FaSun /> : <FaMoon />}
            {theme === 'cyberpunk' ? 'Classic Theme' : 'Cyberpunk Theme'}
          </button>
          <button onClick={copyShareLink} className="share-button">
            <FaShare /> Share Board
          </button>
          <div className="join-code">
            Join Code: <span>{board.joinCode}</span>
          </div>
          <button onClick={() => navigate('/')} className="back-button">
            Back to Home
          </button>
        </div>
      </header>

        <div className="add-item-form">
          <form onSubmit={addItem}>
            <input
              type="text"
              value={newItem.text}
              onChange={(e) => setNewItem({ ...newItem, text: e.target.value })}
              placeholder="Add a new item..."
              required
            />
            <select
              value={newItem.columnId}
              onChange={(e) => setNewItem({ ...newItem, columnId: e.target.value })}
              required
            >
              {/* Explicitly define the order of columns in the dropdown */}
              {['went-well', 'to-improve', 'brilliant-ideas'].map((columnId) => (
                <option key={columnId} value={columnId}>
                  {board.columns[columnId].title}
                </option>
              ))}
            </select>
            <button type="submit">Add Item</button>
          </form>
        </div>

        {/* Action Modal */}
        {showActionModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Add Action Item</h2>
              <textarea
                value={actionItem.text}
                onChange={(e) => setActionItem({ ...actionItem, text: e.target.value })}
                placeholder="What action should be taken?"
                rows={4}
              />
              <div className="modal-buttons">
                <button onClick={() => setShowActionModal(false)} className="cancel-button">
                  Cancel
                </button>
                <button onClick={saveAction} className="save-button">
                  Save Action
                </button>
              </div>
            </div>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="board-columns">
            {/* Explicitly define the order of columns */}
            {['went-well', 'to-improve', 'brilliant-ideas'].map((columnId) => {
              const column = board.columns[columnId];

              // Determine which icon to use based on column id
              let ColumnIcon;
              switch(columnId) {
                case 'went-well':
                  ColumnIcon = FaSmile;
                  break;
                case 'to-improve':
                  ColumnIcon = FaTools;
                  break;
                case 'brilliant-ideas':
                  ColumnIcon = FaLightbulb;
                  break;
                default:
                  ColumnIcon = null;
              }

              return (
                <div key={columnId} className={`column column-${columnId}`}>
                  <h2>
                    {ColumnIcon && <ColumnIcon className="column-icon" />}
                    {column.title}
                  </h2>
                  <div className="column-items">
                    <SortableContext
                      items={column.items.map(item => `${item.id}::${columnId}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      {column.items.length > 0 ? (
                        column.items.map((item) => (
                          <SortableItem
                            key={item.id}
                            id={`${item.id}::${columnId}`}
                            item={item}
                            columnId={columnId}
                            handleReaction={handleReaction}
                            deleteItem={deleteItem}
                            addAction={addAction}
                            user={user}
                          />
                        ))
                      ) : (
                        <div className="empty-column-placeholder" id={`empty::${columnId}`}>
                          <p>Add a new item</p>
                        </div>
                      )}
                    </SortableContext>
                  </div>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeId ? (
              <div className="item is-dragging-overlay">
                <div className="item-content">
                  <div className="item-drag-handle">
                    <FaGripVertical />
                  </div>
                  <p>
                    {(() => {
                      const [itemId, columnId] = activeId.split('::');
                      const column = board.columns[columnId];
                      const item = column.items.find(i => i.id === itemId);
                      return item ? item.text : '';
                    })()}
                  </p>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
    </div>
  );
};

export default RetroBoard;
