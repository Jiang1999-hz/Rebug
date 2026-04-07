import { useState } from 'react';

import { formatDateTime } from '../lib/format';
import type { Comment } from '../lib/types';

type CommentThreadProps = {
  comments: Comment[];
  onSubmit: (content: string) => Promise<void>;
};

export function CommentThread({ comments, onSubmit }: CommentThreadProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!content.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit(content.trim());
      setContent('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to send comment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel comments-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Conversation</p>
          <h2>Comments</h2>
        </div>
      </div>

      <div className="comment-list">
        {comments.length === 0 ? (
          <div className="empty-state empty-state--inline">
            <p>No comments yet.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <article className={`comment-card comment-card--${comment.author.toLowerCase()}`} key={comment.id}>
              <div className="comment-card__meta">
                <strong>{comment.author === 'CLIENT' ? 'Client' : 'Developer'}</strong>
                <span>{formatDateTime(comment.createdAt)}</span>
              </div>
              <p>{comment.content}</p>
            </article>
          ))
        )}
      </div>

      <form className="comment-form" onSubmit={handleSubmit}>
        <label htmlFor="reply-content">Reply</label>
        <textarea
          id="reply-content"
          placeholder="Share an update, ask for clarification, or confirm the fix."
          rows={5}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? 'Sending...' : 'Reply'}
        </button>
      </form>
    </section>
  );
}
