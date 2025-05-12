import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import { FaDownload, FaCopy, FaClock, FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

const Home = ({ user }) => {
  const { theme, toggleTheme } = useTheme();
  const [boardName, setBoardName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [myBoards, setMyBoards] = useState([]);
  const [timerDuration, setTimerDuration] = useState(10);
  // eslint-disable-next-line no-unused-vars
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch boards created by this user
    const fetchMyBoards = async () => {
      try {
        const q = query(
          collection(db, 'boards'),
          where('createdBy', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const boards = [];
        querySnapshot.forEach((doc) => {
          boards.push({ id: doc.id, ...doc.data() });
        });
        setMyBoards(boards);
      } catch (error) {
        console.error('Error fetching boards:', error);
      }
    };

    if (user) {
      fetchMyBoards();
    }
  }, [user]);

  const createBoard = async (e) => {
    e.preventDefault();
    if (!boardName.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // Generate a unique join code
      const joinCode = uuidv4().substring(0, 8);

      // Create a new board in Firestore
      const boardRef = await addDoc(collection(db, 'boards'), {
        name: boardName,
        joinCode,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        timerSettings: {
          duration: timerDuration, // in minutes
          enabled: timerDuration > 0,
          startTime: serverTimestamp(),
          visible: false // Will be set to true when timer expires
        },
        columns: {
          'went-well': {
            id: 'went-well',
            title: 'What Went Well',
            items: []
          },
          'to-improve': {
            id: 'to-improve',
            title: 'What Could Be Improved',
            items: []
          },
          'brilliant-ideas': {
            id: 'brilliant-ideas',
            title: 'Brilliant Ideas',
            items: []
          }
        }
      });

      // Navigate to the new board
      navigate(`/board/${boardRef.id}`);
    } catch (error) {
      console.error('Error creating board:', error);
      setError('Failed to create board. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const joinBoard = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // Find the board with the given join code
      const q = query(
        collection(db, 'boards'),
        where('joinCode', '==', joinCode.trim())
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No board found with that join code. Please check and try again.');
        return;
      }

      // Navigate to the board
      const boardDoc = querySnapshot.docs[0];
      navigate(`/board/${boardDoc.id}`);
    } catch (error) {
      console.error('Error joining board:', error);
      setError('Failed to join board. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const exportBoardAsTxt = async (boardId, boardName) => {
    try {
      setExportLoading(true);
      setExportSuccess(null);
      setError(null);

      // Get the board data
      const boardDoc = await getDoc(doc(db, 'boards', boardId));

      if (!boardDoc.exists()) {
        throw new Error('Board not found');
      }

      const boardData = boardDoc.data();
      const columns = boardData.columns;

      // Create text content
      let textContent = `# ${boardName}\n\n`;

      // Add each column and its items
      Object.values(columns).forEach(column => {
        textContent += `## ${column.title}\n\n`;

        if (column.items && column.items.length > 0) {
          column.items.forEach((item, index) => {
            // Add item text
            textContent += `${index + 1}. ${item.text}\n`;
            
            // Add reactions if they exist
            const likeCount = item.reactions ? Object.keys(item.reactions).length : 0;
            const dislikeCount = item.dislikes ? Object.keys(item.dislikes).length : 0;
            
            if (likeCount > 0 || dislikeCount > 0) {
              textContent += `   Reactions: 👍 ${likeCount} | 👎 ${dislikeCount}\n`;
            }
            
            // Add action if it exists
            if (item.action) {
              textContent += `   ACTION: ${item.action}\n`;
            }
          });
        } else {
          textContent += 'No items in this column.\n';
        }

        textContent += '\n';
      });

      // Create a blob and download link
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${boardName.replace(/\s+/g, '-').toLowerCase()}-export.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess('Board exported successfully!');
    } catch (error) {
      console.error('Error exporting board:', error);
      setError('Failed to export board. Please try again.');
    } finally {
      setExportLoading(false);

      // Clear success message after 3 seconds
      if (setExportSuccess) {
        setTimeout(() => setExportSuccess(null), 3000);
      }
    }
  };

  const copyBoardToClipboard = async (boardId, boardName) => {
    try {
      setExportLoading(true);
      setExportSuccess(null);
      setError(null);

      // Get the board data
      const boardDoc = await getDoc(doc(db, 'boards', boardId));

      if (!boardDoc.exists()) {
        throw new Error('Board not found');
      }

      const boardData = boardDoc.data();
      const columns = boardData.columns;

      // Create text content
      let textContent = `# ${boardName}\n\n`;

      // Add each column and its items
      Object.values(columns).forEach(column => {
        textContent += `## ${column.title}\n\n`;

        if (column.items && column.items.length > 0) {
          column.items.forEach((item, index) => {
            // Add item text
            textContent += `${index + 1}. ${item.text}\n`;
            
            // Add reactions if they exist
            const likeCount = item.reactions ? Object.keys(item.reactions).length : 0;
            const dislikeCount = item.dislikes ? Object.keys(item.dislikes).length : 0;
            
            if (likeCount > 0 || dislikeCount > 0) {
              textContent += `   Reactions: 👍 ${likeCount} | 👎 ${dislikeCount}\n`;
            }
            
            // Add action if it exists
            if (item.action) {
              textContent += `   ACTION: ${item.action}\n`;
            }
          });
        } else {
          textContent += 'No items in this column.\n';
        }

        textContent += '\n';
      });

      // Copy to clipboard
      await navigator.clipboard.writeText(textContent);

      setExportSuccess('Board copied to clipboard!');
    } catch (error) {
      console.error('Error copying board:', error);
      setError('Failed to copy board. Please try again.');
    } finally {
      setExportLoading(false);

      // Clear success message after 3 seconds
      if (setExportSuccess) {
        setTimeout(() => setExportSuccess(null), 3000);
      }
    }
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Retro Board</h1>
        <div className="header-actions">
          <button onClick={toggleTheme} className="theme-toggle-button">
            {theme === 'cyberpunk' ? <FaSun /> : <FaMoon />}
            {theme === 'cyberpunk' ? 'Classic Theme' : 'Cyberpunk Theme'}
          </button>
          <button onClick={handleSignOut} className="sign-out-button">Sign Out</button>
        </div>
      </header>

      <div className="home-content">
        <div className="create-board-section">
          <h2>Create a New Board</h2>
          <form onSubmit={createBoard}>
            <input
              type="text"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="Enter board name"
              required
            />
            <div className="timer-settings">
              <label htmlFor="timerDuration">
                <FaClock /> Timer Duration (minutes):
              </label>
              <div className="timer-input-group">
                <input
                  type="range"
                  id="timerDuration"
                  min="0"
                  max="30"
                  step="5"
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                />
                <span className="timer-value">{timerDuration} min</span>
              </div>
              <p className="timer-description">
                {timerDuration === 0
                  ? 'No timer - board content always visible'
                  : `Board content will be hidden for ${timerDuration} minutes`}
              </p>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Board'}
            </button>
          </form>
        </div>

        <div className="join-board-section">
          <h2>Join an Existing Board</h2>
          <form onSubmit={joinBoard}>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter join code"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Joining...' : 'Join Board'}
            </button>
          </form>
        </div>

        {error && <p className="error-message">{error}</p>}

        {myBoards.length > 0 && (
          <div className="my-boards-section">
            <h2>My Boards</h2>
            {exportSuccess && <p className="success-message">{exportSuccess}</p>}
            <ul className="boards-list">
              {myBoards.map((board) => (
                <li key={board.id}>
                  <div className="board-info" onClick={() => navigate(`/board/${board.id}`)}>
                    <span className="board-name">{board.name}</span>
                    <span className="join-code">Join Code: {board.joinCode}</span>
                  </div>
                  <div className="board-actions">
                    <button
                      className="board-action-button download-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        exportBoardAsTxt(board.id, board.name);
                      }}
                      title="Download as TXT"
                    >
                      <FaDownload />
                    </button>
                    <button
                      className="board-action-button copy-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyBoardToClipboard(board.id, board.name);
                      }}
                      title="Copy to Clipboard"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
