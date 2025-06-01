import React, { useState, useEffect } from 'react';
import BacklogAPI from './services/backlogApi';

function App() {
  // Load configuration from localStorage
  const loadConfigFromStorage = () => {
    try {
      const savedConfig = localStorage.getItem('backlog-tool-config');
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
    } catch (error) {
      console.warn('Failed to restore configuration:', error);
    }
    return {
      spaceUrl: '',
      apiKey: '',
      projectId: '',
      issueKeyFrom: '',
      issueKeyTo: ''
    };
  };

  const [config, setConfig] = useState(loadConfigFromStorage);
  
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [backlogApi, setBacklogApi] = useState(null);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [stats, setStats] = useState({
    totalIssues: 0,
    totalAttachments: 0,
    totalSize: 0
  });

  // Save configuration to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('backlog-tool-config', JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save configuration:', error);
    }
  }, [config]);

  // Configuration change handler
  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
    setSuccess('');
  };

  // API connection test
  const testConnection = async () => {
    if (!config.spaceUrl || !config.apiKey) {
      setError('Please enter Space URL and API Key');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const api = new BacklogAPI(config.spaceUrl, config.apiKey);
      await api.testConnection();
      setBacklogApi(api);
      
      // Get project list
      const projectList = await api.getProjects();
      setProjects(projectList);
      setSuccess('Connection successful');
    } catch (err) {
      setError(err.message);
      setBacklogApi(null);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Search issues with attachments
  const searchIssuesWithAttachments = async () => {
    if (!backlogApi || !config.projectId) {
      setError('Please select a project');
      return;
    }

    setLoading(true);
    setError('');
    setIssues([]);
    setSelectedAttachments([]);
    
    try {
      const issueKeyRange = config.issueKeyFrom && config.issueKeyTo ? {
        from: config.issueKeyFrom.trim(),
        to: config.issueKeyTo.trim()
      } : null;

      const issuesWithAttachments = await backlogApi.getIssuesWithAttachments(
        config.projectId,
        issueKeyRange
      );
      
      setIssues(issuesWithAttachments);
      
      // Calculate statistics
      const totalAttachments = issuesWithAttachments.reduce(
        (sum, issue) => sum + issue.attachments.length, 0
      );
      const totalSize = issuesWithAttachments.reduce(
        (sum, issue) => sum + issue.attachments.reduce(
          (attachSum, attach) => attachSum + (attach.size || 0), 0
        ), 0
      );
      
      setStats({
        totalIssues: issuesWithAttachments.length,
        totalAttachments,
        totalSize
      });
      
      setSuccess(`Found ${issuesWithAttachments.length} issues with attachments`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle attachment selection
  const toggleAttachmentSelection = (issueId, attachmentId, issueKey, fileName, attachment) => {
    const key = `${issueId}-${attachmentId}`;
    
    setSelectedAttachments(prev => {
      const exists = prev.find(item => item.key === key);
      
      if (exists) {
        return prev.filter(item => item.key !== key);
      } else {
        return [...prev, {
          key,
          issueId,
          attachmentId,
          issueKey,
          fileName,
          isCommentAttachment: attachment.isCommentAttachment,
          commentId: attachment.commentId
        }];
      }
    });
  };

  // Toggle all attachments selection
  const toggleAllAttachments = () => {
    if (selectedAttachments.length === 0) {
      // Select all
      const allAttachments = [];
      issues.forEach(issue => {
        issue.attachments.forEach(attachment => {
          allAttachments.push({
            key: `${issue.id}-${attachment.id}`,
            issueId: issue.id,
            attachmentId: attachment.id,
            issueKey: issue.issueKey,
            fileName: attachment.name,
            isCommentAttachment: attachment.isCommentAttachment,
            commentId: attachment.commentId
          });
        });
      });
      setSelectedAttachments(allAttachments);
    } else {
      // Deselect all
      setSelectedAttachments([]);
    }
  };

  // Delete selected attachments
  const deleteSelectedAttachments = async () => {
    if (selectedAttachments.length === 0) {
      setError('Please select attachments to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedAttachments.length} attachments? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const results = await backlogApi.deleteMultipleAttachments(selectedAttachments);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      if (failureCount === 0) {
        setSuccess(`Successfully deleted ${successCount} attachments`);
      } else {
        setSuccess(`Deleted ${successCount} attachments (${failureCount} failed)`);
      }
      
      // Show error details if any failures
      if (failureCount > 0) {
        const failures = results.filter(r => !r.success);
        console.error('Deletion failures:', failures);
      }
      
      // Refresh issue list
      setSelectedAttachments([]);
      await searchIssuesWithAttachments();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>Backlog Attachment Cleaner</h1>
        <p>A tool to bulk delete attachments from Backlog issues</p>
      </div>

      {/* Configuration Section */}
      <div className="form-section">
        <h2>Connection Settings</h2>
        
        <div className="form-group">
          <label>Space URL</label>
          <input
            type="text"
            value={config.spaceUrl}
            onChange={(e) => handleConfigChange('spaceUrl', e.target.value)}
            placeholder="e.g. https://yourspace.backlog.jp or https://yourspace.backlog.com"
          />
        </div>
        
        <div className="form-group">
          <label>API Key</label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => handleConfigChange('apiKey', e.target.value)}
            placeholder="Enter your Backlog API key"
          />
        </div>
        
        <button 
          className="button" 
          onClick={testConnection}
          disabled={loading || !config.spaceUrl || !config.apiKey}
        >
          {loading ? 'Connecting...' : 'Test Connection'}
        </button>
      </div>

      {/* Project Selection */}
      {projects.length > 0 && (
        <div className="form-section">
          <h2>Project Selection</h2>
          
          <div className="form-group">
            <label>Project</label>
            <select
              value={config.projectId}
              onChange={(e) => handleConfigChange('projectId', e.target.value)}
            >
              <option value="">Please select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.projectKey})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Issue Key Range (Optional)</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                value={config.issueKeyFrom}
                onChange={(e) => handleConfigChange('issueKeyFrom', e.target.value)}
                placeholder="e.g. PROJ-1"
                style={{ flex: 1 }}
              />
              <span>to</span>
              <input
                type="text"
                value={config.issueKeyTo}
                onChange={(e) => handleConfigChange('issueKeyTo', e.target.value)}
                placeholder="e.g. PROJ-100"
                style={{ flex: 1 }}
              />
            </div>
          </div>
          
          <button 
            className="button" 
            onClick={searchIssuesWithAttachments}
            disabled={loading || !config.projectId}
          >
            {loading ? 'Searching...' : 'Search Issues with Attachments'}
          </button>
        </div>
      )}

      {/* Error and Success Messages */}
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Statistics */}
      {issues.length > 0 && (
        <div className="stats">
          <div className="stat-card">
            <div className="stat-number">{stats.totalIssues}</div>
            <div className="stat-label">Issues with Attachments</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalAttachments}</div>
            <div className="stat-label">Total Attachments</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{formatFileSize(stats.totalSize)}</div>
            <div className="stat-label">Total File Size</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{selectedAttachments.length}</div>
            <div className="stat-label">Selected</div>
          </div>
        </div>
      )}

      {/* Issue List */}
      {issues.length > 0 && (
        <div className="results-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Issues with Attachments</h2>
            <div>
              <button 
                className="button" 
                onClick={toggleAllAttachments}
                style={{ marginRight: '10px' }}
              >
                {selectedAttachments.length === 0 ? 'Select All' : 'Deselect All'}
              </button>
              <button 
                className="button danger" 
                onClick={deleteSelectedAttachments}
                disabled={loading || selectedAttachments.length === 0}
              >
                {loading ? 'Deleting...' : `Delete Selected Files (${selectedAttachments.length})`}
              </button>
            </div>
          </div>

          {issues.map(issue => (
            <div key={issue.id} className="ticket-item">
              <div className="ticket-header">
                <div className="ticket-title">{issue.summary}</div>
                <div className="ticket-key">{issue.issueKey}</div>
              </div>
              
              <div className="attachments-list">
                {issue.attachments.map(attachment => {
                  const isSelected = selectedAttachments.some(
                    item => item.key === `${issue.id}-${attachment.id}`
                  );
                  
                  return (
                    <div key={attachment.id} className="attachment-item">
                      <div className="attachment-info">
                        <div className="attachment-name">
                          {attachment.name}
                          {attachment.isCommentAttachment && (
                            <span className="comment-badge">Comment Attachment</span>
                          )}
                        </div>
                        <div className="attachment-size">
                          {formatFileSize(attachment.size)} | Created: {new Date(attachment.created).toLocaleDateString('en-US')}
                        </div>
                        {attachment.isCommentAttachment && attachment.commentContent && (
                          <div className="comment-preview">
                            Comment: {attachment.commentContent.length > 50 ? 
                              attachment.commentContent.substring(0, 50) + '...' : 
                              attachment.commentContent
                            }
                          </div>
                        )}
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleAttachmentSelection(
                            issue.id, 
                            attachment.id, 
                            issue.issueKey, 
                            attachment.name,
                            attachment
                          )}
                        />
                        Delete
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading">
          Processing...
        </div>
      )}
    </div>
  );
}

export default App;
