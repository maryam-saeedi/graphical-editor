import React from "react";
import { withStyles } from '@material-ui/core/styles';

import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import IconButton from '@material-ui/core/IconButton';

const bStyle = {
    button: {
        width: '30px',
        height: '30px',
        borderRadius: '4px',
        transition: 'all 0.2s',
        padding: '5px',
        boxSizing: 'border-box',
        margin: '2px',

        '& svg': {
            fill: 'rgb(110, 110, 110)',
        },

        '&:hover': {
            backgroundColor: 'white',
            boxShadow: '0 5px 5px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-1px)',
            transition: 'all 0.1s',


            '& svg': {
                fill: 'black',
            }
        },

        '&:active': {
            transform: 'translateY(0px)',
            opacity: '0.8',
        },
    },

    selected: {
        width: '30px',
        height: '30px',
        borderRadius: '4px',
        transition: 'all 0.2s',
        padding: '5px',
        boxSizing: 'border-box',
        margin: '2px',
        backgroundColor: 'rgb(91, 82, 145)',

        "& svg": {
            fill: 'white',
        }
    }

}
const Button = props => {
    const style = {
        __html: props.image
    };

    const { classes } = props
    return (
        <IconButton
            className={props.active ? classes.selected : classes.button}
            // dangerouslySetInnerHTML={style}
            onClick={e => props.handleClick(e, props.name)}
        >
        <img src={props.image} />
        </IconButton>
    );
};
const StyledButton = withStyles(bStyle)(Button)

const style = {
    toolbox: {
        boxSizing: 'border-box',
        padding: '15px',
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'flex-start'
    },
}
class OptionMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            anchorEl: null,
            menu: ''
        }
        this.handleItemClick = this.handleItemClick.bind(this)
        this.handleClick = this.handleClick.bind(this)
        this.handleClose = this.handleClose.bind(this)
    }

    handleItemClick(name) {
        const {handleClick} = this.props
        return function (event) {
            handleClick(name)
        }
    }
    handleClick(name) {
        const self = this
        return function (event) {
            self.setState({ anchorEl: event.currentTarget, menu: name })
        }
    }
    handleClose() {
        this.setState({ anchorEl: null })
    }

    render() {
        const { classes } = this.props
        const { anchorEl, menu } = this.state
        const items = this.props.items.map(item => (
            <div>
                <StyledButton
                    active={this.props.activeItem === item.name ? true : false}
                    name={item.name}
                    image={item.image}
                    key={item.name}
                    handleClick={this.handleClick(item.name)}
                />
                <Menu
                    elevation={0}
                    getContentAnchorEl={null}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl) && menu == item.name}
                    onClose={this.handleClose}
                >
                    {item.sub.map(submenu =>
                        <MenuItem onClick={this.handleItemClick(submenu.name)}>
                            <ListItemIcon>
                                <img src={submenu.image} />
                            </ListItemIcon>
                            <ListItemText primary={submenu.name} />
                        </MenuItem>
                    )}
                </Menu>
            </div>
        ));

        return <div className={classes.toolbox}>{items}</div>;
    }
}

export default withStyles(style)(OptionMenu)