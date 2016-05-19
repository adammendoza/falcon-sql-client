import React, {Component, PropTypes} from 'react';
import styles from './Settings.css';
import classnames from 'classnames';

const DB_CREDENTIALS = [
    'username',
    'password',
    'port'
];

const DATABASES = {
    MYSQL: 'MYSQL',
    SQLITE: 'SQLITE',
    POSTGRES: 'POSTGRES',
    MARIADB: 'MARIADB',
    MSSQL: 'MSSQL'
};

const LOGOS = {
    POSTGRES: 'https://www.joyent.com/content/02-public-cloud/02-benchmarks/03-postgresql/header.png?v=1433286515',
    MYSQL: './images/mysqlLogo.png',
    MARIADB: 'https://mariadb.org/wp-content/uploads/2015/10/mariadb-usa-inc.png',
    MSSQL: 'http://www.softwaresolutionsweb.com/images/sqlimage.png',
    SQLITE: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/SQLite370.svg/1280px-SQLite370.svg.png'
};


export default class Settings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedDB: DATABASES.MYSQL,
            status: 'INITIALIZED'
        };
        props.configActions.setValue({
            key: 'engine',
            value: DATABASES.MYSQL.toLowerCase()
        });
    }

    componentWillReceiveProps(nextProps) {
        let status;
        if (nextProps.ipc.hasIn(['error', 'message'])) {
            status = 'ERROR';
        } else if (nextProps.ipc.hasIn('rows')) {
            status = 'SUCCESS';
        }
        if (status) {
            this.setState({status});
        }
    }

    render() {
        const {ipcActions, configActions, configuration, ipc} = this.props;
        const {setValue} = configActions;

        const logos = Object.keys(DATABASES).map(DB => (
            <div className={classnames(
                    styles.logo, {
                        [styles.logoSelected]: this.state.selectedDB === DB
                    }
                )}
                onClick={() => {
                    this.setState({selectedDB: DB});
                    configActions.setValue({
                        key: 'engine',
                        value: DB.toLowerCase()
                    });
                }}
            >
                <img
                    className={styles.logoImage}
                    src={LOGOS[DB]}
                />
            </div>
        ));

        const inputs = DB_CREDENTIALS.map(credential => (
            <input
                placeholder={credential}
                type={credential === 'password' ? 'password' : 'text'}
                onChange={e => (
                    setValue({key: credential, value: e.target.value})
                )}
            />
        ));

        let successMessage = null;
        let errorMessage = null;
        let buttonMessage = 'Connect';
        if (this.state.status === 'ERROR') {
            errorMessage = (
                <pre>
                    {
                        'Hm... there was an error connecting: ' +
                        ipc.getIn(['error', 'message'])
                    }
                </pre>
            );
        } else if (this.state.status === 'SUCCESS') {
            successMessage = (
                <pre>
                    {ipc.get('rows').toJS()}
                </pre>
            );
        } else if (this.state.status === 'LOADING') {
            buttonMessage = 'Connecting';
        }

        console.warn('this.state: ', this.state);

        return (
            <div style={{width: '100%'}}>
                <h2>Configuration</h2>

                <div>
                    <div>
                        {logos}
                    </div>
                </div>

                <div className={styles.inputContainer}>
                    {inputs}
                </div>

                <div className={styles.footer}>
                    <a className={styles.buttonPrimary}
                       onClick={() => {
                           this.setState({status: 'LOADING'});
                           ipcActions.connect(configuration);
                       }}
                    >
                        {buttonMessage}
                    </a>
                </div>

                {errorMessage}
                {successMessage}

                <hr/>
                <pre>
                    {JSON.stringify(this.props.ipc.toJS().error, null, 2)}
                </pre>

            </div>
        );
    }
}

Component.propTypes = {
    queries: PropTypes.Array,
    responses: PropTypes.Array
};
