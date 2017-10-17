from setuptools import setup, find_packages

requires = [
    'pyramid',
    'pyramid_tm',
    'pyramid_rpc',  # for json rpc server

    'beautifulsoup4',
    'elasticsearch-dsl>=5.0.0,<6.0.0',
    'genshi',
    'hiredis',
    'oss2',  # for Aliyun oss bucket management
    'pika',
    'pillow', # PIL
    'psd-tools',
    'psycopg2',
    'sqlalchemy',
    'transaction',
    'z3c.rml',
    'zope.sqlalchemy',

    'hm.lib',
    'weblibs',
    'webmodel',

    # for development, this is required
    # 'Paste'
]


setup(
    name='ecop',
    version='1.0',
    author='Hong Yuan',
    author_email='hongyuan@homemaster.cn',
    url='http://www.homemaster.cn',
    packages=find_packages(),
    install_requires=requires,
    entry_points={
        'paste.app_factory': ['main=ecop:main']
    }
)
