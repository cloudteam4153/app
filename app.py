from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from datetime import datetime
import json
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'

# In-memory storage for tasks (in production, use a database)
tasks = [
    {
        'id': 1,
        'title': 'Review Q4 budget proposal',
        'description': 'Review and provide feedback on the Q4 budget proposal from finance team',
        'priority': 'high',
        'status': 'pending',
        'due_date': '2024-01-15',
        'source': 'email',
        'created_at': '2024-01-10',
        'reminder': True
    },
    {
        'id': 2,
        'title': 'Schedule team meeting',
        'description': 'Schedule weekly team standup for next week',
        'priority': 'medium',
        'status': 'in-progress',
        'due_date': '2024-01-12',
        'source': 'slack',
        'created_at': '2024-01-09',
        'reminder': False
    },
    {
        'id': 3,
        'title': 'Update project documentation',
        'description': 'Update API documentation for the new features',
        'priority': 'low',
        'status': 'completed',
        'due_date': '2024-01-08',
        'source': 'email',
        'created_at': '2024-01-07',
        'reminder': False
    }
]

next_id = 4

@app.route('/')
def index():
    return render_template('index.html', tasks=tasks)

@app.route('/add_task', methods=['POST'])
def add_task():
    global next_id
    
    title = request.form.get('title')
    description = request.form.get('description', '')
    priority = request.form.get('priority', 'medium')
    due_date = request.form.get('due_date', '')
    source = request.form.get('source', 'email')
    
    if title:
        new_task = {
            'id': next_id,
            'title': title,
            'description': description,
            'priority': priority,
            'status': 'pending',
            'due_date': due_date,
            'source': source,
            'created_at': datetime.now().strftime('%Y-%m-%d'),
            'reminder': False
        }
        tasks.append(new_task)
        next_id += 1
        flash('Task added successfully!', 'success')
    else:
        flash('Title is required!', 'error')
    
    return redirect(url_for('index'))

@app.route('/update_status/<int:task_id>', methods=['POST'])
def update_status(task_id):
    new_status = request.form.get('status')
    
    for task in tasks:
        if task['id'] == task_id:
            task['status'] = new_status
            break
    
    return redirect(url_for('index'))

@app.route('/delete_task/<int:task_id>')
def delete_task(task_id):
    global tasks
    tasks = [task for task in tasks if task['id'] != task_id]
    flash('Task deleted successfully!', 'success')
    return redirect(url_for('index'))

@app.route('/search')
def search():
    search_term = request.args.get('q', '')
    priority_filter = request.args.get('priority', 'all')
    
    filtered_tasks = tasks
    
    if search_term:
        filtered_tasks = [task for task in filtered_tasks 
                         if search_term.lower() in task['title'].lower() 
                         or search_term.lower() in task['description'].lower()]
    
    if priority_filter != 'all':
        filtered_tasks = [task for task in filtered_tasks 
                         if task['priority'] == priority_filter]
    
    return render_template('index.html', tasks=filtered_tasks, 
                          search_term=search_term, priority_filter=priority_filter)

@app.route('/api/tasks')
def api_tasks():
    return jsonify(tasks)

@app.route('/api/stats')
def api_stats():
    stats = {
        'total': len(tasks),
        'pending': len([t for t in tasks if t['status'] == 'pending']),
        'in_progress': len([t for t in tasks if t['status'] == 'in-progress']),
        'completed': len([t for t in tasks if t['status'] == 'completed'])
    }
    return jsonify(stats)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
