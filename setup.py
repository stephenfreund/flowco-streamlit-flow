from pathlib import Path

import setuptools

this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text()

setuptools.setup(
    name="flowco-streamlit-flow",
    version="0.0.2",
    author="Stephen Freund",
    author_email="sfreund@williams.edu",
    description="Streamlit Component Wrapper for React Flow, modified for Flowco.  Original: https://github.com/dkapur17/streamlit-flow",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/stephenfreund/flowco-streamlit-flow",
    packages=setuptools.find_packages(),
    include_package_data=True,
    classifiers=[],
    python_requires=">=3.8",
    install_requires=[
        # By definition, a Custom Component depends on Streamlit.
        # If your component has other Python dependencies, list
        # them here.
        "streamlit >= 1.0.0",
    ],
    extras_require={
        "devel": [
            "wheel",
            "pytest==7.4.0",
            "playwright==1.39.0",
            "requests==2.31.0",
            "pytest-playwright-snapshot==1.0",
            "pytest-rerunfailures==12.0",
        ]
    },
)
