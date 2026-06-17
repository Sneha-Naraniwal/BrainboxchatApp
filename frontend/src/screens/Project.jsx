import React, { useState, useEffect, useContext, useRef, useCallback } from 'react'
import { UserContext } from '../context/user.context'
import { useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'

import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

import { getWebContainer } from '../config/webcontainer'

function useResize(initialSize, min, max) {
  const [size, setSize] = useState(initialSize)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startSize = useRef(0)

  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startSize.current = size
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [size])

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return
      const delta = e.clientX - startX.current
      setSize(Math.min(max, Math.max(min, startSize.current + delta)))
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [min, max])

  const Handle = () => (
    <div
      onMouseDown={onMouseDown}
      style={{
        width: '4px',
        flexShrink: 0,
        background: 'transparent',
        cursor: 'col-resize',
        position: 'relative',
        zIndex: 10,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#388bfd55'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: '2px', height: '2px', borderRadius: '50%', background: '#30363d' }} />
        ))}
      </div>
    </div>
  )

  return [size, Handle]
}

const Project = () => {
  const location = useLocation()

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [isModalOpen, setIsModalOpen]         = useState(false)
  const [selectedUserId, setSelectedUserId]   = useState(new Set())
  const [project, setProject]                 = useState(location.state.project)
  const [message, setMessage]                 = useState('')
  const { user }                              = useContext(UserContext)
  const messageBox                            = useRef(null)

  const [users, setUsers]         = useState([])
  const [messages, setMessages]   = useState([])
  const [fileTree, setFileTree]   = useState({})
  const [currentFile, setCurrentFile] = useState(null)
  const [openFiles, setOpenFiles]     = useState([])
  const [webContainer, setWebContainer] = useState(null)
  const [iframeUrl, setIframeUrl]       = useState(null)
  const [runProcess, setRunProcess]     = useState(null)
  const [isRunning, setIsRunning]       = useState(false)

  const [chatW,    ChatHandle]    = useResize(320, 220, 560)
  const [explorerW, ExplorerHandle] = useResize(200, 120, 380)
  const [previewW,  PreviewHandle]  = useResize(420, 280, 800)

  const handleUserClick = (id) => {
    setSelectedUserId(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function addCollaborators() {
    axios.put('/projects/add-user', {
      projectId: location.state.project._id,
      users: Array.from(selectedUserId),
    })
      .then(res => { setIsModalOpen(false); setProject(res.data.project) })
      .catch(err => console.error('❌', err.response?.data || err.message))
  }

  const send = () => {
    if (!message.trim()) return
    sendMessage('project-message', { message, sender: user })
    setMessages(prev => [...prev, { sender: user, message }])
    setMessage('')
  }

  function WriteAiMessage(msg) {
    let obj = {}
    try { obj = JSON.parse(msg) } catch {}
    return (
      <div style={{ background: '#0d1117', color: '#7ee787', border: '1px solid #238636', borderRadius: '8px', padding: '10px', fontSize: '12px', fontFamily: 'monospace', overflowX: 'auto' }}>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {JSON.stringify(obj, null, 2)}
        </pre>
      </div>
    )
  }

  useEffect(() => {
    initializeSocket(project._id)

    if (!webContainer) {
      getWebContainer().then(c => setWebContainer(c))
    }

    // ── LOAD CHAT HISTORY ON MOUNT ──────────────────────────────────────────
    axios.get(`/messages/${project._id}`)
      .then(res => {
        setMessages(res.data.messages)
      })
      .catch(err => console.error('Failed to load chat history:', err))
    // ────────────────────────────────────────────────────────────────────────

    receiveMessage('project-message', data => {
      if (data.sender._id === 'ai') {
        let parsed = {}
        try { parsed = JSON.parse(data.message) } catch {}
        if (webContainer && parsed.fileTree) webContainer.mount(parsed.fileTree)
        if (parsed.fileTree) setFileTree(parsed.fileTree)
        setMessages(prev => [...prev, data])
      } else {
        setMessages(prev => [...prev, data])
      }
    })

    axios.get(`/projects/get-project/${location.state.project._id}`)
      .then(res => { setProject(res.data.project); setFileTree(res.data.project.fileTree || {}) })
      .catch(console.error)

    axios.get('/users/all')
      .then(res => setUsers(res.data.users))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (messageBox.current) messageBox.current.scrollTop = messageBox.current.scrollHeight
  }, [messages])

  function saveFileTree(ft) {
    axios.put('/projects/update-file-tree', { projectId: project._id, fileTree: ft }).catch(console.log)
  }

  return (
    <main style={{ display: 'flex', height: '100vh', width: '100vw', background: '#0d1117', color: '#e6edf3', fontFamily: "'Inter', -apple-system, sans-serif", overflow: 'hidden' }}>

      {/* ══ CHAT PANEL ══ */}
      <section style={{ width: chatW, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh', background: '#161b22', borderRight: '1px solid #21262d', position: 'relative', flexShrink: 0 }}>

        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #21262d', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px', minWidth: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3fb950', boxShadow: '0 0 6px #3fb950', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name || 'Project'}</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <Btn icon="ri-user-add-line" label="Add" onClick={() => setIsModalOpen(true)} />
            <Btn icon="ri-group-line" onClick={() => setIsSidePanelOpen(true)} />
          </div>
        </header>

        <div ref={messageBox} style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '8px', scrollbarWidth: 'thin', scrollbarColor: '#21262d transparent' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#484f58', padding: '40px 16px', fontSize: '13px' }}>
              <i className="ri-chat-3-line" style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }} />
              No messages yet
            </div>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.sender._id === user._id?.toString()
            const isAI = msg.sender._id === 'ai'
            return (
              <div key={i} style={{
                maxWidth: isAI ? '98%' : '82%',
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                background: isAI ? '#0d1117' : isMe ? '#1a3a6b' : '#21262d',
                border: `1px solid ${isAI ? '#238636' : isMe ? '#388bfd' : '#30363d'}`,
                borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                padding: '8px 10px',
                display: 'flex', flexDirection: 'column', gap: '4px',
              }}>
                <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: isAI ? '#3fb950' : isMe ? '#58a6ff' : '#8b949e' }}>
                  {isAI ? '⚡ AI' : isMe ? 'You' : msg.sender.email}
                </span>
                <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                  {isAI ? WriteAiMessage(msg.message) : <p style={{ margin: 0 }}>{msg.message}</p>}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '6px', padding: '8px', borderTop: '1px solid #21262d', flexShrink: 0 }}>
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Message… (Enter to send)"
            style={{ flex: 1, minWidth: 0, background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', padding: '7px 12px', color: '#e6edf3', fontSize: '13px', outline: 'none' }}
          />
          <button onClick={send} style={{ width: 36, height: 36, borderRadius: '8px', background: '#238636', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ri-send-plane-fill" />
          </button>
        </div>

        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#161b22', zIndex: 20, transform: isSidePanelOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #21262d' }}>
            <span style={{ fontWeight: 600 }}>Collaborators</span>
            <button style={ICON_BTN_STYLE} onClick={() => setIsSidePanelOpen(false)}><i className="ri-close-line" /></button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {project.users?.map(u => (
              <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px' }}
                onMouseEnter={e => e.currentTarget.style.background = '#21262d'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Avatar />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{u.email}</div>
                  <div style={{ fontSize: '11px', color: '#8b949e' }}>Member</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ChatHandle />

      <section style={{ flex: 1, display: 'flex', height: '100vh', overflow: 'hidden', minWidth: 0 }}>

        <div style={{ width: explorerW, minWidth: 0, background: '#161b22', borderRight: '1px solid #21262d', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '9px 12px', fontSize: '10px', fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #21262d', flexShrink: 0 }}>
            Explorer
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {Object.keys(fileTree).map((file, i) => (
              <button key={i} onClick={() => { setCurrentFile(file); setOpenFiles(p => [...new Set([...p, file])]) }}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 12px', width: '100%', textAlign: 'left', border: 'none', background: currentFile === file ? '#21262d' : 'transparent', borderLeft: `2px solid ${currentFile === file ? '#58a6ff' : 'transparent'}`, color: currentFile === file ? '#e6edf3' : '#8b949e', fontSize: '12px', cursor: 'pointer', overflow: 'hidden' }}>
                <i className="ri-file-code-line" style={{ flexShrink: 0, fontSize: '12px' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file}</span>
              </button>
            ))}
            {Object.keys(fileTree).length === 0 && <div style={{ padding: '14px 12px', fontSize: '12px', color: '#484f58' }}>No files yet</div>}
          </div>
        </div>

        <ExplorerHandle />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#161b22', borderBottom: '1px solid #21262d', flexShrink: 0, minHeight: 40 }}>
            <div style={{ display: 'flex', overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
              {openFiles.map((file, i) => (
                <button key={i} onClick={() => setCurrentFile(file)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: currentFile === file ? '#0d1117' : 'transparent', borderRight: '1px solid #21262d', borderBottom: `2px solid ${currentFile === file ? '#58a6ff' : 'transparent'}`, color: currentFile === file ? '#e6edf3' : '#8b949e', fontSize: '12px', fontFamily: 'monospace', cursor: 'pointer', whiteSpace: 'nowrap', border: 'none', flexShrink: 0 }}>
                  <i className="ri-file-code-line" style={{ fontSize: '11px' }} />
                  {file}
                </button>
              ))}
            </div>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', margin: '0 8px', background: isRunning ? '#1a3a2a' : '#238636', border: '1px solid #2ea043', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
              onClick={async () => {
                if (!webContainer) return
                setIsRunning(true)
                await webContainer.mount(fileTree)
                const ip = await webContainer.spawn('npm', ['install'])
                ip.output.pipeTo(new WritableStream({ write(c) { console.log(c) } }))
                if (runProcess) runProcess.kill()
                const rp = await webContainer.spawn('npm', ['start'])
                rp.output.pipeTo(new WritableStream({ write(c) { console.log(c) } }))
                setRunProcess(rp)
                webContainer.on('server-ready', (port, url) => { setIframeUrl(url); setIsRunning(false) })
              }}>
              <i className={isRunning ? 'ri-loader-4-line' : 'ri-play-fill'} />
              {isRunning ? 'Running…' : 'Run'}
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', background: '#0d1117' }}>
            {fileTree[currentFile] ? (
              <pre className="hljs" style={{ margin: 0, minHeight: '100%', borderRadius: 0, background: '#0d1117' }}>
                <code
                  className="hljs"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={e => {
                    const ft = { ...fileTree, [currentFile]: { file: { contents: e.target.innerText } } }
                    setFileTree(ft); saveFileTree(ft)
                  }}
                  dangerouslySetInnerHTML={{ __html: hljs.highlight(fileTree[currentFile].file.contents || '', { language: 'javascript' }).value }}
                  style={{ display: 'block', whiteSpace: 'pre-wrap', padding: '16px', paddingBottom: '24rem', outline: 'none', fontSize: '13px', lineHeight: '1.7', fontFamily: "'JetBrains Mono','Fira Code',monospace", background: 'transparent' }}
                />
              </pre>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#484f58', gap: '8px' }}>
                <i className="ri-code-s-slash-line" style={{ fontSize: '48px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>Select a file to edit</p>
              </div>
            )}
          </div>
        </div>

        {iframeUrl && webContainer && <PreviewHandle />}

        {iframeUrl && webContainer && (
          <div style={{ width: previewW, minWidth: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #21262d', background: '#161b22', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', borderBottom: '1px solid #21262d', flexShrink: 0 }}>
              <i className="ri-global-line" style={{ color: '#8b949e', fontSize: '13px', flexShrink: 0 }} />
              <input type="text" value={iframeUrl} onChange={e => setIframeUrl(e.target.value)}
                style={{ flex: 1, minWidth: 0, background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', padding: '4px 10px', color: '#8b949e', fontSize: '12px', outline: 'none', fontFamily: 'monospace' }} />
            </div>
            <iframe src={iframeUrl} style={{ width: '100%', flex: 1, border: 'none', background: '#fff' }} />
          </div>
        )}
      </section>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', width: 400, maxWidth: '90vw', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #21262d' }}>
              <span style={{ fontWeight: 600, fontSize: '16px' }}>Add Collaborators</span>
              <button style={ICON_BTN_STYLE} onClick={() => setIsModalOpen(false)}><i className="ri-close-line" /></button>
            </div>
            <div style={{ padding: '8px', maxHeight: 360, overflowY: 'auto' }}>
              {users.map(u => {
                const sel = Array.from(selectedUserId).includes(u._id)
                return (
                  <div key={u._id} onClick={() => handleUserClick(u._id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', background: sel ? '#1a3a6b33' : 'transparent', border: `1px solid ${sel ? '#388bfd55' : 'transparent'}`, marginBottom: 2 }}>
                    <Avatar />
                    <div style={{ flex: 1, fontSize: '13px', fontWeight: 500 }}>{u.email}</div>
                    {sel && <i className="ri-check-line" style={{ color: '#58a6ff', fontSize: '16px' }} />}
                  </div>
                )
              })}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #21262d', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={addCollaborators}
                style={{ padding: '8px 20px', background: '#238636', border: '1px solid #2ea043', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                Add{selectedUserId.size > 0 ? ` (${selectedUserId.size})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

const ICON_BTN_STYLE = { display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 9px', background: 'transparent', border: '1px solid #30363d', borderRadius: '6px', color: '#8b949e', cursor: 'pointer', fontSize: '12px' }

function Btn({ icon, label, onClick }) {
  return (
    <button style={ICON_BTN_STYLE} onClick={onClick}>
      <i className={icon} />
      {label && <span>{label}</span>}
    </button>
  )
}

function Avatar() {
  return (
    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#1f4f8f,#388bfd)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', flexShrink: 0 }}>
      <i className="ri-user-fill" />
    </div>
  )
}

export default Project