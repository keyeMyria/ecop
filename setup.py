from setuptools import setup, find_packages

requires = [
    'pyramid>1.9',
    'pyramid_tm',
    'pyramid_rpc',  # for json rpc server
    'pyramid_session_redis',

    'beautifulsoup4',
    'elasticsearch-dsl>=5.0.0,<6.0.0',
    'genshi',
    'hiredis'
    'isoweek',
    'oss2',  # for Aliyun oss bucket management
    'pika>=0.9,<0.11', # as required by pika-pool
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
