/**
 * GamePlayWeb - HTML-based game interface for testing mechanics
 * Wraps the CLI API for Playwright testability
 */

import { useState, useCallback, useEffect } from 'react';
import { execute, resetState, getState, getAvailableCommands } from '../../cli/api';

interface GameLog {
  id: number;
  type: 'info' | 'success' | 'error' | 'combat';
  message: string;
}

export default function GamePlayWeb() {
  const [gameState, setGameState] = useState<ReturnType<typeof getState> | null>(null);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [logCounter, setLogCounter] = useState(0);
  const [commandInput, setCommandInput] = useState('');
  const [availableCommands, setAvailableCommands] = useState<ReturnType<typeof getAvailableCommands>>([]);

  // Initialize game
  useEffect(() => {
    resetState();
    refreshState();
    addLog('info', 'Game initialized. Create a character to begin.');
  }, []);

  const refreshState = useCallback(() => {
    const state = getState();
    setGameState(state);
    setAvailableCommands(getAvailableCommands());
  }, []);

  const addLog = useCallback((type: GameLog['type'], message: string) => {
    setLogCounter(prev => {
      const newId = prev + 1;
      setLogs(logs => [...logs.slice(-50), { id: newId, type, message }]);
      return newId;
    });
  }, []);

  const executeCommand = useCallback((command: string) => {
    const result = execute(command);
    addLog(result.success ? 'success' : 'error', `> ${command}\n${result.message}`);
    refreshState();
    return result;
  }, [addLog, refreshState]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commandInput.trim()) {
      executeCommand(commandInput.trim());
      setCommandInput('');
    }
  };

  // Quick action buttons
  const quickActions = [
    { label: 'Create HUmar', command: 'create-character humar TestHunter', show: !gameState?.character },
    { label: 'Show Stats', command: 'show-stats', show: !!gameState?.character },
    { label: 'Inventory', command: 'show-inventory', show: !!gameState?.character },
    { label: 'Equipment', command: 'show-equipment', show: !!gameState?.character },
    { label: 'Go to Shop', command: 'goto shop', show: gameState?.location === 'city' },
    { label: 'Go to Guild', command: 'goto guild', show: gameState?.location === 'city' },
    { label: 'Go to Inventory', command: 'goto inventory', show: gameState?.location === 'city' },
    { label: 'Back to City', command: 'goto city', show: gameState?.location !== 'city' && gameState?.location !== 'field' },
    { label: 'List Items', command: 'list-items', show: gameState?.location === 'shop' },
    { label: 'Buy Monomate', command: 'buy monomate', show: gameState?.location === 'shop' },
    { label: 'List Fields', command: 'list-fields', show: gameState?.location === 'guild' },
    { label: 'Enter Gurhacia', command: 'enter-field gurhacia-valley normal', show: gameState?.location === 'guild' },
    { label: 'Show Session', command: 'show-session', show: gameState?.location === 'field' || gameState?.location === 'guild' },
    { label: 'Use Telepipe', command: 'use-telepipe', show: gameState?.location === 'field' },
    { label: 'Abandon', command: 'abandon-session', show: gameState?.location === 'guild' },
    { label: 'Claim Rewards', command: 'claim-rewards', show: gameState?.location === 'guild' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      fontFamily: 'monospace',
      background: '#1a1a2e',
      color: '#eee'
    }}>
      {/* Header */}
      <header style={{
        padding: '12px 16px',
        background: '#16213e',
        borderBottom: '2px solid #0f3460',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '18px' }}>PSZ Game Test Interface</h1>
        <button
          onClick={() => { resetState(); refreshState(); setLogs([]); addLog('info', 'Game reset.'); }}
          data-testid="reset-game"
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Reset Game
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel - Game State */}
        <aside style={{
          width: '280px',
          padding: '16px',
          background: '#16213e',
          borderRight: '2px solid #0f3460',
          overflowY: 'auto'
        }}>
          <section data-testid="character-info">
            <h3 style={{ margin: '0 0 8px 0', color: '#e94560' }}>Character</h3>
            {gameState?.character ? (
              <div style={{ fontSize: '14px', lineHeight: 1.6 }}>
                <div data-testid="char-name">{gameState.character.character_name}</div>
                <div data-testid="char-class">{gameState.character.class_id}</div>
                <div data-testid="char-level">Level: {gameState.character.level}</div>
                <div data-testid="char-exp">EXP: {gameState.character.experience}</div>
                <div data-testid="char-meseta">Meseta: {gameState.character.meseta ?? 0}</div>
              </div>
            ) : (
              <div style={{ color: '#666' }}>No character</div>
            )}
          </section>

          <section data-testid="location-info" style={{ marginTop: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#e94560' }}>Location</h3>
            <div data-testid="current-location" style={{
              fontSize: '16px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              color: '#4ecca3'
            }}>
              {gameState?.location || 'unknown'}
            </div>
          </section>

          <section data-testid="inventory-section" style={{ marginTop: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#e94560' }}>Inventory</h3>
            <div style={{ fontSize: '13px' }}>
              {gameState?.inventory && gameState.inventory.length > 0 ? (
                gameState.inventory.map((item, i) => (
                  <div key={i} data-testid={`inv-item-${item.itemId}`}>
                    {item.itemId} x{item.quantity}
                  </div>
                ))
              ) : (
                <div style={{ color: '#666' }}>(empty)</div>
              )}
            </div>
          </section>

          <section data-testid="combat-section" style={{ marginTop: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#e94560' }}>Combat</h3>
            {gameState?.inCombat ? (
              <div style={{ fontSize: '13px' }}>
                <div style={{ color: '#ff6b6b' }}>IN COMBAT</div>
                <div>Enemies: {gameState.enemies?.length || 0}</div>
              </div>
            ) : (
              <div style={{ color: '#666' }}>Not in combat</div>
            )}
          </section>
        </aside>

        {/* Main Area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Quick Actions */}
          <div style={{
            padding: '12px 16px',
            background: '#1f4068',
            borderBottom: '1px solid #0f3460',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {quickActions.filter(a => a.show).map((action, i) => (
              <button
                key={i}
                onClick={() => executeCommand(action.command)}
                data-testid={`action-${action.command.replace(/\s+/g, '-')}`}
                style={{
                  padding: '6px 12px',
                  background: '#4ecca3',
                  color: '#1a1a2e',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Log Output */}
          <div
            data-testid="game-log"
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              background: '#0d1117'
            }}
          >
            {logs.map(log => (
              <div
                key={log.id}
                data-testid={`log-${log.type}`}
                style={{
                  marginBottom: '8px',
                  padding: '8px',
                  background: log.type === 'error' ? '#2d1f1f' :
                             log.type === 'success' ? '#1f2d1f' :
                             log.type === 'combat' ? '#2d2d1f' : '#1f1f2d',
                  borderLeft: `3px solid ${
                    log.type === 'error' ? '#e94560' :
                    log.type === 'success' ? '#4ecca3' :
                    log.type === 'combat' ? '#f9ed69' : '#4a90d9'
                  }`,
                  whiteSpace: 'pre-wrap',
                  fontSize: '13px',
                  lineHeight: 1.4
                }}
              >
                {log.message}
              </div>
            ))}
          </div>

          {/* Command Input */}
          <form onSubmit={handleCommandSubmit} style={{
            padding: '12px 16px',
            background: '#16213e',
            borderTop: '2px solid #0f3460',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Enter command (e.g., create-character humar MyName)"
              data-testid="command-input"
              style={{
                flex: 1,
                padding: '10px 12px',
                background: '#0d1117',
                border: '1px solid #0f3460',
                borderRadius: '4px',
                color: '#eee',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}
            />
            <button
              type="submit"
              data-testid="submit-command"
              style={{
                padding: '10px 20px',
                background: '#e94560',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontWeight: 'bold'
              }}
            >
              Execute
            </button>
          </form>
        </main>

        {/* Right Panel - Available Commands */}
        <aside style={{
          width: '240px',
          padding: '16px',
          background: '#16213e',
          borderLeft: '2px solid #0f3460',
          overflowY: 'auto'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#e94560' }}>Available Commands</h3>
          <div style={{ fontSize: '12px' }}>
            {availableCommands.map((cmd, i) => (
              <div
                key={i}
                data-testid={`cmd-${cmd.name}`}
                onClick={() => setCommandInput(cmd.usage)}
                style={{
                  padding: '6px 8px',
                  marginBottom: '4px',
                  background: '#0d1117',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ color: '#4ecca3', fontWeight: 'bold' }}>{cmd.name}</div>
                <div style={{ color: '#888', fontSize: '11px' }}>{cmd.description}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
