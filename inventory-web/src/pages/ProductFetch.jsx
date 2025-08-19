import { useState } from "react"
import ProductsList from "../components/ProductsList"
import { TextField, Typography, Container } from "@mui/material"

const ProductDisplayFetch = () => {
	const [productsAPI, setProductsAPI] = useState('https://fakestoreapi.com/products')

	return (
		<Container >
			<Typography variant="h4" align="center">
				Product API management
			</Typography>
			<TextField 
				value = {productsAPI} 
				onChange={(e)=>{setProductsAPI(e.target.value)}} 
				align = 'left'
				fullWidth>
				Place your API here
			</TextField>
			<ProductsList productsAPI = {productsAPI}/>
		</Container>
	)
}
export default ProductDisplayFetch