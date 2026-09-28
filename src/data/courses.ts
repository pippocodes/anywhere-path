import type { Course } from '../types'

export const seedCourses: Course[] = [
  {
    id: 'web-dev',
    name: 'Web Development',
    modules: [
      {
        id: 'wd-frontend-basics',
        name: 'Frontend Basics',
        topics: [
          { id: 'html', name: 'HTML Basics', hours: 4, done: false },
          { id: 'css', name: 'CSS Fundamentals', hours: 5, done: false },
          { id: 'js', name: 'JavaScript Basics', hours: 8, done: false },
          { id: 'dom', name: 'DOM Manipulation', hours: 6, done: false },
        ],
      },
      {
        id: 'wd-react-essentials',
        name: 'React Essentials',
        topics: [
          { id: 'react-basics', name: 'React Basics', hours: 10, done: false },
          { id: 'react-router', name: 'React Router', hours: 4, done: false },
          { id: 'context', name: 'Context API & Hooks', hours: 6, done: false },
        ],
      },
      {
        id: 'wd-shipping-it',
        name: 'Shipping It',
        topics: [
          { id: 'api', name: 'API Integration', hours: 5, done: false },
          { id: 'deploy', name: 'Git & Deployment', hours: 4, done: false },
        ],
      },
    ],
  },
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    modules: [
      {
        id: 'dsa-linear',
        name: 'Linear Structures',
        topics: [
          { id: 'arrays', name: 'Arrays', hours: 5, done: false },
          { id: 'linked-lists', name: 'Linked Lists', hours: 6, done: false },
          { id: 'stacks-queues', name: 'Stacks & Queues', hours: 5, done: false },
          { id: 'recursion', name: 'Recursion', hours: 5, done: false },
        ],
      },
      {
        id: 'dsa-algorithms',
        name: 'Algorithms',
        topics: [
          { id: 'sorting', name: 'Sorting Algorithms', hours: 6, done: false },
          { id: 'searching', name: 'Searching Algorithms', hours: 4, done: false },
          { id: 'dp', name: 'Dynamic Programming', hours: 8, done: false },
        ],
      },
      {
        id: 'dsa-nonlinear',
        name: 'Non-linear Structures',
        topics: [
          { id: 'trees', name: 'Trees', hours: 8, done: false },
          { id: 'graphs', name: 'Graphs', hours: 8, done: false },
          { id: 'hashing', name: 'Hashing', hours: 5, done: false },
        ],
      },
    ],
  },
]
