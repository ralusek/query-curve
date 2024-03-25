from setuptools import setup, find_packages

setup(
    name='query-curve',
    version='0.1.0',
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    description='A query utility meant to query along a cubic bezier curve. Generate accompanying curve at https://querycurve.com',
    long_description=open('README.md').read(),
    long_description_content_type='text/markdown',
    author='Tomas Savigliano',
    author_email='ralusek@gmail.com',
    license='MIT',
    url='https://github.com/ralusek/query-curve/tree/main/repositories/query/python',
    install_requires=[
        # Any necessary dependencies
    ],
    classifiers=[
        # Trove classifiers
        # Full list: https://pypi.org/classifiers/
        'Programming Language :: Python :: 3',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
    python_requires='>=3.6',
)
