# Lib
The idea about this folder is that everything in `lib` could be their own package. They are very different and serve different purposes, but they don't merit being included in the core code. I've tried to create a monorepo but they are sooo hard to implement due to dependency management.

## Restrictions
What makes the `lib` folder different than any other folder? Things in `lib` should ONLY access other things in `lib` and external libraries :)
