import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {Table, Column, Cell} from 'fixed-data-table';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import CodeEditorField from './CodeEditorField.react.js';
import ChartEditor from 'react-plotly-dnd-editor';
import * as Actions from '../../../actions/sessions';

class Preview extends Component {

    constructor(props) {
        super(props);
        this.testClass = this.testClass.bind(this);
        this.updateCode = this.updateCode.bind(this);
        this.toggleEditor = this.toggleEditor.bind(this);
        this.runQuery = this.runQuery.bind(this);

        this.props = {
            code: '',
            rows: [],
            columnNames: [],
            error: '',
            loading: true,
            showEditor: true
        };
    }

    componentDidMount() {
        const {previewTableRequest} = this.props;
        if (previewTableRequest.status >= 400) {
            this.props.updatePreview({
                error: JSON.stringify(previewTableRequest),
                loading: false
            });
        } else if (previewTableRequest.status === 'loading') {
            this.props.updatePreview({
                loading: true
            });
        } else if (previewTableRequest.status === 200) {
            const {columnnames, rows} = previewTableRequest.content;
            this.props.updatePreview({
                columnNames: columnnames,
                rows: rows,
                loading: false
            });
        } else {
            return null;
        }
    }

    testClass() {
        return 'test-connected';
    }

    runQuery() {
        const query = this.props.code;
        const {connectionObject, dispatch} = this.props;

        console.warn('runQuery:', query, connectionObject);

        const p = dispatch(Actions.runSqlQuery(
            connectionObject.id,
            connectionObject.dialect,
            query
        ));

        p.then( result => {
            const {columnnames, rows} = result;
            if (typeof rows !== undefined) {
                this.props.updatePreview({
                    columnNames: columnnames,
                    rows: rows,
                    loading: false,
                    error: ''
                });
            }
        })
        .catch( error => {
            this.props.updatePreview({error});
            console.error(error);
        });

    }

    updateCode(newCode) {
        this.props.updatePreview({
            code: newCode
        });
    }

    toggleEditor() {
        this.props.updatePreview({
            showEditor: this.props.showEditor ? false : true
        });
    }

    render() {
        const ErrorMsg = () => {
            if (this.props.error) {
                return (
                    <div>
                        <div>{'Hm... An error occurred while trying to load this table'}</div>
                        <div style={{color: 'red'}}>{this.props.error}</div>
                    </div>
                );
            }
            return null;
        };


        const LoadingMsg = () => {
            if (this.props.loading) {
                return (<div>{'Loading...'}</div>);
            }
            return null;
        };

        const S3Preview = () => {
            const {s3KeysRequest} = this.props;
            if (s3KeysRequest.status >= 400) {
                return (<div>{'Hm... An error occurred while trying to load S3 keys'}</div>);
            } else if (s3KeysRequest.status === 'loading') {
                return (<div>{'Loading...'}</div>);
            } else if (s3KeysRequest.status === 200) {
                return (
                    <div>
                        <h5>CSV Files on S3</h5>
                        <div style={{maxHeight: 500, overflowY: 'auto'}}>
                            {s3KeysRequest.content.filter(object => object.Key.endsWith('.csv'))
                                .map(object => <div>{object.Key}</div>
                            )}
                        </div>
                    </div>
                );
            } else {
                return null;
            }
        };

        const ApacheDrillPreview = () => {
            const {
                apacheDrillStorageRequest,
                apacheDrillS3KeysRequest
            } = this.props;
            if (apacheDrillStorageRequest.status >= 400) {
                return (<div>{'Hm... An error while trying to load Apache Drill'}</div>);
            } else if (apacheDrillStorageRequest.status === 'loading') {
                return (<div>{'Loading...'}</div>);
            } else if (apacheDrillStorageRequest.status === 200) {
                const storage = (
                    <div>
                        <h5>Enabled Apache Drill Storage Plugins</h5>
                        <div style={{maxHeight: 500, overflowY: 'auto'}}>
                            {apacheDrillStorageRequest.content
                                .filter(object => object.config.enabled)
                                .map(object => (
                                    <div>{`${object.name} - ${object.config.connection}`}</div>
                                ))
                            }
                        </div>
                    </div>
                );

                let availableFiles = null;
                if (apacheDrillS3KeysRequest.status === 200) {
                    const parquetFiles = apacheDrillS3KeysRequest
                        .content
                        .filter(object => object.Key.indexOf('.parquet') > -1)
                        .map(object => object.Key.slice(0, object.Key.indexOf('.parquet')) + '.parquet');
                    const uniqueParquetFiles = [];
                    parquetFiles.forEach(file => {
                        if (uniqueParquetFiles.indexOf(file) === -1) {
                            uniqueParquetFiles.push(file);
                        }
                    });
                    if (uniqueParquetFiles.length === 0) {
                        availableFiles = (
                            <div>
                                Heads up! It looks like no parquet files were
                                found in this S3 bucket.
                            </div>
                        );
                    } else {
                        availableFiles = (
                            <div>
                                <h5>Available Parquet Files on S3</h5>
                                <div style={{maxHeight: 500, overflowY: 'auto'}}>
                                    {uniqueParquetFiles.map(key => (
                                        <div>{`${key}`}</div>
                                    ))}
                                </div>
                            </div>
                        );
                    }
                }
                return (
                    <div>
                        {storage}
                        {availableFiles}
                    </div>
                );
            } else {
                return null;
            }
        };

        const columnNames = this.props.columnNames;
        const rows = this.props.rows;

        return (
            <div className={'previewContainer'}>
                <code>
                    <small>
                        <a onClick={this.toggleEditor}>
                            {this.props.showEditor ? 'Hide Editor' : 'Show Editor'}
                        </a>
                    </small>
                </code>

                <div style={{display: this.props.showEditor ? 'block' : 'none'}}>
                    <CodeEditorField
                        value={this.props.code}
                        onChange={this.updateCode}
                        connectionObject={this.props.connectionObject}
                        runQuery={this.runQuery}
                    />
                    <a
                        className='btn btn-primary'
                        onClick={this.runQuery}
                        style={{float: 'right', maxWidth: 100}}
                    >
                        Run
                    </a>
                </div>

                {rows &&
                    <Tabs>
                        <TabList>
                            <Tab>Table</Tab>
                            <Tab>Chart</Tab>
                        </TabList>

                        <TabPanel>
                            <Table
                                rowHeight={50}
                                rowsCount={rows.length}
                                width={800}
                                height={200}
                                headerHeight={40}
                                {...this.props}>
                                {columnNames.map(function(colName, colIndex){
                                    return <Column
                                        columnKey={colName}
                                        key={colIndex}
                                        label={colName}
                                        flexgrow={1}
                                        width={200}
                                        header={<Cell>{colName}</Cell>}
                                        cell={({rowIndex, ...props}) => (
                                            <Cell
                                                height={20}
                                                {...props}
                                            >
                                                {rows[rowIndex][colIndex]}
                                            </Cell>
                                        )}
                                    />;
                                })}
                            </Table>
                        </TabPanel>

                        <TabPanel>
                            <ChartEditor
                                rows={rows}
                                columnNames={columnNames}
                            />
                        </TabPanel>
                    </Tabs>
                }

               {S3Preview()}
               {ApacheDrillPreview()}
               {LoadingMsg()}
               {ErrorMsg()}
            </div>
        );
    }
};

export default connect()(Preview);
