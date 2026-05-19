Traceback (most recent call last):
  File "<frozen runpy>", line 198, in _run_module_as_main
  File "<frozen runpy>", line 88, in _run_code
  File "C:\Users\suven\AppData\Local\Programs\Python\Python312\Scripts\alembic.exe\__main__.py", line 7, in <module>
  File "C:\Users\suven\AppData\Local\Programs\Python\Python312\Lib\site-packages\alembic\config.py", line 1022, in main
    CommandLine(prog=prog).main(argv=argv)
  File "C:\Users\suven\AppData\Local\Programs\Python\Python312\Lib\site-packages\alembic\config.py", line 1012, in main
    self.run_cmd(cfg, options)
  File "C:\Users\suven\AppData\Local\Programs\Python\Python312\Lib\site-packages\alembic\config.py", line 946, in run_cmd
    fn(
  File "C:\Users\suven\AppData\Local\Programs\Python\Python312\Lib\site-packages\alembic\command.py", line 483, in upgrade
    script.run_env()
  File "C:\Users\suven\AppData\Local\Programs\Python\Python312\Lib\site-packages\alembic\script\base.py", line 549, in run_env
    util.load_python_file(self.dir, "env.py")
  File "C:\Users\suven\AppData\Local\Programs\Python\Python312\Lib\site-packages\alembic\util\pyfiles.py", line 116, in load_python_file
    module = load_module_py(module_id, path)
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\suven\AppData\Local\Programs\Python\Python312\Lib\site-packages\alembic\util\pyfiles.py", line 136, in load_module_py
    spec.loader.exec_module(module)  # type: ignore
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap_external>", line 999, in exec_module
  File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
  File "C:\Users\suven\Desktop\OneDriveBackupFiles\Documents\ARDENO STUDIO\Food-Platform\backend\alembic\env.py", line 6, in <module>
    from app.core.config import get_settings
ModuleNotFoundError: No module named 'app'
