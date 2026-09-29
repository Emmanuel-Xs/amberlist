`Zen.sound(name)` and `Zen.confetti(opts)`: the app's feedback moments. Not a component; call them from event handlers.

- Sounds: complete, undo, delete, error, celebrate, tap. Quiet, synthesized, only after a user action; `Zen.sound.enable(false)` when Profile's Sounds switch is off.
- Confetti: only for finishing the day, a long running task, or a habit goal. Skipped under reduced motion.
