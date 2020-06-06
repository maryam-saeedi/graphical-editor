import React from "react";
import { withStyles } from '@material-ui/core/styles';
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

    "& img": {
      filter: 'invert(1)',
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
class Toolbox extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event, name) {
    this.props.handleClick(event, name);
  }

  render() {
    const { classes } = this.props
    const items = this.props.items.map(item => (
      <StyledButton
        active={this.props.activeItem === item.name ? true : false}
        name={item.name}
        image={item.image}
        key={item.name}
        handleClick={this.handleClick}
      />
    ));

    return <div className={classes.toolbox}>{items}</div>;
  }
}

export default withStyles(style)(Toolbox)