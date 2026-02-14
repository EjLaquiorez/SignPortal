import { useState, useEffect } from 'react';
import { workflowAPI } from '../../services/api';
import StageCard from './StageCard';

const WorkflowStages = ({ documentId }) => {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWorkflow();
  }, [documentId]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const response = await workflowAPI.getByDocument(documentId);
      setStages(response.data.workflow || []);
      setError('');
    } catch (err) {
      setError('Failed to load workflow');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading workflow...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  if (stages.length === 0) {
    return <p>No workflow stages found</p>;
  }

  return (
    <div>
      <h3>Workflow Stages</h3>
      <div style={styles.stages}>
        {stages.map((stage, index) => (
          <div key={stage.id} style={styles.stageWrapper}>
            <StageCard stage={stage} onUpdate={fetchWorkflow} />
            {index < stages.length - 1 && <div style={styles.arrow}>↓</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  stages: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  stageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  arrow: {
    fontSize: '2rem',
    color: '#007bff',
    margin: '0.5rem 0'
  },
  loading: {
    padding: '2rem',
    textAlign: 'center'
  },
  error: {
    padding: '1rem',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px'
  }
};

export default WorkflowStages;
