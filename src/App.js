import React, { Component } from "react";
import Panel from "./Panel";
import getWeb3 from "./getWeb3";
import AirlineContract from "./Airline";
import { AirlineService } from "./AirlineService";
import { ToastContainer } from "react-toastr";

const converter = (web3) => {
    return (value) => {
        return web3.utils.fromWei(value.toString(), "ether");
    }
}

export class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            balance: 0,
            account: undefined,
            flights: [],
            customerFlights: [],
            refundableEther: 0
        }
    }

    async componentDidMount(){
        this.web3 = await getWeb3();
        this.toEther = converter(this.web3);

        this.airline = await AirlineContract(this.web3.currentProvider);
        this.AirlineService = new AirlineService(this.airline);

        var account = (await this.web3.eth.getAccounts())[0];

        let flightPurchased = this.airline.FlightPurchased();
        flightPurchased.watch(function(err,result){
            const {customer, price, flight} = result.args;

            if(customer === this.state.account){
                this.container.success(`You purchased a flight to ${flight} with a cost of ${this.toEther(price)} ETH`);
            }else{
                this.container.success(`Last customer purchased a flight to ${flight} with a cost of ${this.toEther(price)} ETH`, "Flight information");
            }
            
        }.bind(this));

        window.ethereum.on('accountsChanged', async function(accounts){
            this.setState({
                account: accounts[0].toLowerCase()
            },() => {
                this.load();
            });
        }.bind(this));

        this.setState(
            {
                account: account.toLowerCase()
            },
            () => {
                this.load();
            }
        )
    }


    async getFlights(){
        let flights = await this.AirlineService.getFlights();
        this.setState(
            {
                flights: flights
            }
        )
    }

    async getCustomerFlights(){
        let customerFlights = await this.AirlineService.getCustomerFlights(this.state.account);
        this.setState(
            {
                customerFlights: customerFlights
            }
        )
    }

    async getBalance(){
        let weiBalance = await this.web3.eth.getBalance(this.state.account);
        this.setState(
            {
                balance: this.toEther(weiBalance)
            }
        )
    }

    async getRefundableEther(){
        let refundableEther = this.toEther(await this.AirlineService.getRefundableEther(this.state.account));
        this.setState({
            refundableEther: refundableEther
        })
    }

    async refundLoyaltyPoints(){
        await this.AirlineService.redeemLoyaltyPoints(this.state.account);

        this.load();
    }

    async buyFlight(flightIndex, flight){

        await this.AirlineService.buyFlight(
            flightIndex,
            this.state.account,
            flight.price
        );

        this.load();
    }

    async load(){
        this.getBalance();
        this.getFlights();
        this.getCustomerFlights();
        this.getRefundableEther();
    }

    render() {
        return <React.Fragment>
            <div className="jumbotron" >
                <h4 className="display-4">My Ethereum airline</h4>
            </div>

            <div className="row">
                <div className="col-sm">
                    <Panel title="My current balance" style={{
        backgroundColor: 'blue',
        width: '100px',
        height: '100px'
      }}>
                        <p><strong>{this.state.account}</strong></p>
                        <span><strong>Balance:</strong> {this.state.balance} ETH</span>
                    </Panel>
                </div>
                <div className="col-sm">
                    <Panel title="Loyalty points - refundable ether">
                        <span>{this.state.refundableEther} ETH</span>
                        <button className="btn btn-sm bg-success text-white" onClick={this.refundLoyaltyPoints.bind(this)}>Refund</button>
                    </Panel>
                </div>
            </div>
            <div className="row">
                <div className="col-sm">
                    <Panel title="Available flights">
                        {this.state.flights.map((flight, i) => {
                            return <div key={i}>
                                <span><strong>{flight.name}</strong> - cost: {this.toEther(flight.price)} ETH</span>
                                <button className="btn btn-sm btn-success text-white" onClick={() => this.buyFlight(i, flight)}>Purchase</button>
                            </div>
                        })}
                    </Panel>
                </div>
                <div className="col-sm">
                    <Panel title="Your flights">
                        {this.state.customerFlights.map((flight, i) => {
                            return <div key={i}>
                                <span><strong>{flight.name}</strong> - cost: {this.toEther(flight.price)} ETH</span>
                            </div>
                        })} 
                    </Panel>
                </div>
            </div>

            <ToastContainer ref={(input) => this.container = input}
                className="toast-top-right">
            </ToastContainer>
        </React.Fragment>
    }
}